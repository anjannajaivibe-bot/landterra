import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { CreateInquirySchema } from '@/lib/validation/payment';
import { createInquiry, getInquiriesForSeller, getInquiriesForBuyer, updateInquiryStatus } from '@/services/inquiry.service';

const USER_INQUIRY_LIMIT = 15;
const USER_INQUIRY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const IP_INQUIRY_LIMIT = 30;
const IP_INQUIRY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'seller' | 'buyer'

  try {
    if (type === 'seller' || authUser.role === 'SELLER') {
      const inquiries = await getInquiriesForSeller(authUser.id);
      return NextResponse.json({ inquiries });
    } else {
      const inquiries = await getInquiriesForBuyer(authUser.id);
      return NextResponse.json({ inquiries });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch inquiries';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  // Rate Limiting (Brute Force / Spam Protection)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ipAddress = forwarded
    ? forwarded.split(',')[0].trim()
    : realIp || '127.0.0.1';

  const userRate = await checkRateLimit(
    `inquiry-user:${authUser.id}`,
    USER_INQUIRY_LIMIT,
    USER_INQUIRY_WINDOW_MS,
  );
  if (!userRate.allowed) {
    return NextResponse.json(
      {
        error:
          'Too many inquiries submitted. Please wait a few minutes before contacting more landowners.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': '600',
        },
      },
    );
  }

  const ipRate = await checkRateLimit(
    `inquiry-ip:${ipAddress}`,
    IP_INQUIRY_LIMIT,
    IP_INQUIRY_WINDOW_MS,
  );
  if (!ipRate.allowed) {
    return NextResponse.json(
      {
        error:
          'Too many inquiries submitted from this network. Please wait a few minutes.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': '600',
        },
      },
    );
  }

  try {
    const body = await req.json();

    let rawPhone = (body.buyerPhone || authUser.phone || '').toString().trim().replace(/\D/g, '');
    if (rawPhone.length === 12 && rawPhone.startsWith('91')) {
      rawPhone = rawPhone.slice(2);
    } else if (rawPhone.length === 11 && rawPhone.startsWith('0')) {
      rawPhone = rawPhone.slice(1);
    }

    const payload = {
      ...body,
      buyerEmail: (body.buyerEmail?.trim() || authUser.email || '').trim(),
      buyerPhone: rawPhone,
      phoneShared: true,
    };
    const validated = CreateInquirySchema.parse(payload);

    const inquiry = await createInquiry({
      propertyId: validated.propertyId,
      buyerId: authUser.id,
      buyerName: authUser.name,
      buyerEmail: validated.buyerEmail,
      buyerPhone: validated.buyerPhone,
      message: validated.message,
      phoneShared: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Inquiry sent directly to landowner. Check your buyer dashboard for updates.',
      inquiry,
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'issues' in err) {
      return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : 'Failed to submit inquiry';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const body = await req.json();
    const { inquiryId, status } = body;

    if (!inquiryId || typeof inquiryId !== 'string') {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 });
    }

    if (!['PENDING', 'RESPONDED', 'CLOSED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Allowed: PENDING, RESPONDED, CLOSED' }, { status: 400 });
    }

    const updated = await updateInquiryStatus(inquiryId, authUser.id, status);

    if (!updated) {
      return NextResponse.json({ error: 'Inquiry not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      inquiry: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update inquiry status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
