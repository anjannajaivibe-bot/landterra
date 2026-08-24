import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/auth';
import { getProperties } from '@/services/property.service';

export async function GET(req: NextRequest) {
  const adminUser = await requireRole(req, ['ADMIN']);
  if (adminUser instanceof NextResponse) return adminUser;

  const { searchParams } = new URL(req.url);
  const verificationStatus = searchParams.get('verificationStatus') || undefined;
  const listingStatus = searchParams.get('listingStatus') || undefined;
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;

  try {
    const result = await getProperties({
      verificationStatus: verificationStatus as any,
      listingStatus: (listingStatus || 'ALL') as any,
      page,
      limit,
      sortBy: 'newest',
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch admin properties';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
