import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ContactMessageModel } from '@/models/ContactMessage';
import { CreateContactSchema } from '@/lib/validation/payment';
import { notifySupportContactMessage } from '@/services/email.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request payload' },
        { status: 400 }
      );
    }

    const validated = CreateContactSchema.parse(body);

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      undefined;

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
