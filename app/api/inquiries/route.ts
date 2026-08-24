import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { CreateInquirySchema } from '@/lib/validation/payment';
import { createInquiry, getInquiriesForSeller, getInquiriesForBuyer } from '@/services/inquiry.service';

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

  try {
    const body = await req.json();
    const validated = CreateInquirySchema.parse(body);

    const inquiry = await createInquiry({
      propertyId: validated.propertyId,
      buyerId: authUser.id,
      buyerName: authUser.name,
      buyerEmail: authUser.email,
      buyerPhone: validated.buyerPhone || authUser.phone,
      message: validated.message,
      phoneShared: validated.phoneShared,
    });

    return NextResponse.json({
      success: true,
      message: 'Inquiry sent directly to verified seller. Check your buyer dashboard for updates.',
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
