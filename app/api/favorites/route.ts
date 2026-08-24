import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { toggleFavorite, getFavoritesForUser } from '@/services/inquiry.service';

export async function GET(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const favorites = await getFavoritesForUser(authUser.id);
    return NextResponse.json({ favorites });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch favorites';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const { propertyId } = await req.json();
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
    }

    const result = await toggleFavorite(authUser.id, propertyId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle favorite';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
