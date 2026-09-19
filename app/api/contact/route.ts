import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ContactMessageModel } from '@/models/ContactMessage';
import { CreateContactSchema } from '@/lib/validation/actions';
import { notifySupportContactMessage } from '@/services/email.service';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request payload' },
        { status: 400 }
      );
    }

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 1. Sliding-window IP Rate Limiting (5 requests per 10 minutes)
    const rate = await checkRateLimit(`contact-ip:${ipAddress}`, 5, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please wait a few minutes before trying again.' },
        { status: 429, headers: { 'Retry-After': '600' } }
      );
    }

    const validated = CreateContactSchema.parse(body);

    await connectToDatabase();

    const contactDoc = await ContactMessageModel.create({
      name: validated.name,
      email: validated.email,
      phone: validated.phone || undefined,
      subject: validated.subject || undefined,
      message: validated.message,
      status: 'NEW',
      ipAddress,
    });

    // Dispatch notification to BhoomiMitra support desk in background
    notifySupportContactMessage({
      name: validated.name,
      email: validated.email,
      phone: validated.phone || undefined,
      subject: validated.subject || undefined,
      message: validated.message,
    }).catch((err) => {
      console.error('Support email notification error:', err);
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your query has been received. Our compliance and support team will get back to you shortly.',
        id: String(contactDoc._id),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'issues' in err) {
      const zErr = err as { issues: Array<{ message: string }> };
      return NextResponse.json(
        { error: zErr.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }
    const msg = err instanceof Error ? err.message : 'Failed to submit contact message';
    console.error('Contact API error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
