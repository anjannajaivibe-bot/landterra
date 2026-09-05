import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { deleteFilesFromStorage } from '@/services/upload.service';
import { connectToDatabase } from '@/lib/db/mongodb';
import PropertyModel from '@/models/Property';

export const dynamic = 'force-dynamic';

async function handleDeleteRequest(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) {
    return authUser;
  }

  try {
    let body: any = {};
    if (req.method === 'GET' || req.method === 'DELETE') {
      const url = new URL(req.url);
      const keyParam = url.searchParams.get('key') || url.searchParams.get('objectKey');
      if (keyParam) {
        body.objectKey = keyParam;
      } else {
        body = await req.json().catch(() => ({}));
      }
    } else {
      body = await req.json().catch(() => ({}));
    }

    const singleKey = typeof body.objectKey === 'string' ? body.objectKey.trim() : '';
    const objectKeys: string[] = Array.isArray(body.objectKeys)
      ? body.objectKeys.filter((k: unknown) => typeof k === 'string' && (k as string).trim().length > 0)
      : singleKey
        ? [singleKey]
        : [];

    if (objectKeys.length === 0) {
      return NextResponse.json({ error: 'objectKey or objectKeys is required.' }, { status: 400 });
    }

    // Sanitize keys to prevent malicious paths
    for (const key of objectKeys) {
      if (key.includes('..') || key.startsWith('/')) {
        return NextResponse.json({ error: 'Invalid object key format.' }, { status: 400 });
      }
    }

    // 1. Delete all requested assets from Cloudflare R2
    await deleteFilesFromStorage(objectKeys);

    // 2. Automatically delete references from MongoDB if the user owns properties containing these keys
    await connectToDatabase();

    const isAuthorizedAdmin = authUser.role === 'ADMIN';
    const sellerFilter = isAuthorizedAdmin ? {} : { sellerId: authUser.id };

    // Remove from images array
    await PropertyModel.updateMany(
      { ...sellerFilter, 'images.objectKey': { $in: objectKeys } },
      { $pull: { images: { objectKey: { $in: objectKeys } } } }
    );

    // Remove video if matched
    await PropertyModel.updateMany(
      { ...sellerFilter, 'video.objectKey': { $in: objectKeys } },
      { $unset: { video: 1 } }
    );

    // Remove from documents array
    await PropertyModel.updateMany(
      { ...sellerFilter, 'documents.objectKey': { $in: objectKeys } },
      { $pull: { documents: { objectKey: { $in: objectKeys } } } }
    );

    return NextResponse.json(
      {
        success: true,
        deletedKeys: objectKeys,
        message: 'Deleted successfully from storage and database.',
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('Delete upload error:', err);
    const message = err instanceof Error ? err.message : 'Failed to delete upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleDeleteRequest(req);
}

export async function DELETE(req: NextRequest) {
  return handleDeleteRequest(req);
}
