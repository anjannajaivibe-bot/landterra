import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { recordBuyerCallAction } from '@/services/inquiry.service';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  const { id } = await context.params;

  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwarded
      ? forwarded.split(',')[0].trim()
      : realIp || undefined;

    const result = await recordBuyerCallAction({
      propertyId: id,
      buyerId: authUser.id,
      buyerName: authUser.name,
      buyerEmail: authUser.email,
      buyerPhone: authUser.phone,
      ipAddress,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'Failed to record call action';
    const status = msg.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
