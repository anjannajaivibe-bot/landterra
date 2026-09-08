import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { verifyCloudflareTurnstile } from '@/lib/security/cloudflare-turnstile';
import {
  recordBuyerCallAction,
  InquiryBusinessError,
} from '@/services/inquiry.service';

/* ================================================================
   RATE LIMIT CONFIGURATION (Mass-Scraping Protection)
================================================================ */

// Primary: 15 contact requests per 10 minutes per authenticated user
const USER_CONTACT_LIMIT = 15;
const USER_CONTACT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// Secondary: 30 contact requests per 10 minutes per IP
const IP_CONTACT_LIMIT = 30;
const IP_CONTACT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  // 1. Authenticate FIRST
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  // 2. Validate property ID format (24-hex MongoDB ObjectId)
  const { id } = await context.params;
  if (!id || typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return NextResponse.json(
      { error: 'Invalid property ID format.' },
      { status: 400 },
    );
  }

  // 3. Extract IP and verify Cloudflare Turnstile Human Verification Token
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ipAddress = forwarded
    ? forwarded.split(',')[0].trim()
    : realIp || '127.0.0.1';

  const body = await req.json().catch(() => ({}));
  const turnstileToken = body?.turnstileToken || req.headers.get('x-turnstile-token') || req.headers.get('cf-turnstile-token');
  const isAuditOnly = body?.channel === 'WHATSAPP' && !turnstileToken;

  if (!isAuditOnly) {
    const turnstileResult = await verifyCloudflareTurnstile(turnstileToken, ipAddress);
    if (!turnstileResult.success) {
      return NextResponse.json(
        {
          error:
            turnstileResult.error ||
            'Human verification required before contacting seller. Please complete the Cloudflare security check.',
          code: 'TURNSTILE_REQUIRED',
        },
        { status: 403 }
      );
    }
  }

  // 3a. Primary Authenticated-User Rate Limit
  const userRate = await checkRateLimit(
    `call-user:${authUser.id}`,
    USER_CONTACT_LIMIT,
    USER_CONTACT_WINDOW_MS,
  );
  if (!userRate.allowed) {
    return NextResponse.json(
      {
        error:
          'Too many contact requests. Please wait a few minutes before contacting more sellers.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': '600',
        },
      },
    );
  }

  // 3b. Secondary IP-Based Rate Limit
  const ipRate = await checkRateLimit(
    `call-ip:${ipAddress}`,
    IP_CONTACT_LIMIT,
    IP_CONTACT_WINDOW_MS,
  );
  if (!ipRate.allowed) {
    return NextResponse.json(
      {
        error:
          'Too many contact requests from this network. Please wait a few minutes.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': '600',
        },
      },
    );
  }

  // 4. Verify property existence, visibility, authorization & record contact lead
  try {
    const channel = body?.channel === 'WHATSAPP' ? 'WHATSAPP' : 'PHONE';
    const result = await recordBuyerCallAction({
      propertyId: id,
      buyerId: authUser.id,
      buyerName: authUser.name,
      buyerEmail: authUser.email,
      buyerPhone: authUser.phone,
      ipAddress,
      channel,
    });

    if (isAuditOnly) {
      return NextResponse.json(
        { success: true, message: 'WhatsApp contact lead recorded.' },
        { status: 200 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof InquiryBusinessError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status },
      );
    }

    console.error('Unexpected error recording call action:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request.' },
      { status: 500 },
    );
  }
}
