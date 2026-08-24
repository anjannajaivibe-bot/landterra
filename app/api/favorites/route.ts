import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import {
  toggleFavorite,
  removeFavorite,
  getFavoritePropertiesForUser,
} from '@/services/inquiry.service';

export async function GET(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const { favoriteIds, properties } = await getFavoritePropertiesForUser(authUser.id);
    return NextResponse.json({
      favorites: favoriteIds,
      properties,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch favorites';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const body = await req.json().catch(() => ({}));
    const propertyId = body?.propertyId;
    if (!propertyId || typeof propertyId !== 'string') {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
    }

    const result = await toggleFavorite(authUser.id, propertyId);
    return NextResponse.json({
      success: true,
      isFavorite: result.isFavorite,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle favorite';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const body = await req.json().catch(() => ({}));
    const propertyId =
      body?.propertyId || req.nextUrl.searchParams.get('propertyId');

    if (!propertyId || typeof propertyId !== 'string') {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
    }

    const result = await removeFavorite(authUser.id, propertyId);
    return NextResponse.json({
      success: true,
      isFavorite: result.isFavorite,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to remove favorite';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
