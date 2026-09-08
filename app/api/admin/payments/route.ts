import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/auth';
import { getAllPayments } from '@/services/payment.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const adminUser = await requireRole(req, ['ADMIN']);
  if (adminUser instanceof NextResponse) return adminUser;

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(200, Math.max(1, parseInt(limitParam, 10))) : 100;

  try {
    const payments = await getAllPayments(limit);
    return NextResponse.json({ success: true, payments });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch platform payments';
    console.error('Admin payments fetch error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
