import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { getPaymentsForSeller, getAllPayments } from '@/services/payment.service';

export async function GET(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    if (authUser.role === 'ADMIN') {
      const payments = await getAllPayments(100);
      return NextResponse.json({ payments });
    } else {
      const payments = await getPaymentsForSeller(authUser.id);
      return NextResponse.json({ payments });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch payments';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
