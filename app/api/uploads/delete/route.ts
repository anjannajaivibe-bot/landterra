import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { deleteFilesFromStorage } from '@/services/upload.service';
import { connectToDatabase } from '@/lib/db/mongodb';
import PropertyModel from '@/models/Property';

export const dynamic = 'force-dynamic';

async function handleDeleteRequest(req: NextRequest) {
  // 1. Authenticate user
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) {
    return authUser;
  }

  try {
    // 2. Validate input and extract requested objectKey(s)
    let body: Record<string, unknown> = {};
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const keyParam = url.searchParams.get('key') || url.searchParams.get('objectKey');
      if (keyParam) {
        body = { objectKey: keyParam };
      } else {
        body = await req.json().catch(() => ({}));
      }
    } else {
      body = await req.json().catch(() => ({}));
    }

    const rawKeys: unknown[] = [];
    if (typeof body.objectKey === 'string') {
      rawKeys.push(body.objectKey);
    }
    if (Array.isArray(body.objectKeys)) {
      rawKeys.push(...body.objectKeys);
    }

    const sanitizedKeys: string[] = [];
    for (const key of rawKeys) {
      if (typeof key !== 'string') continue;
      const trimmed = key.trim();
      if (!trimmed) continue;
      sanitizedKeys.push(trimmed);
    }

    // Deduplicate keys
    const objectKeys = Array.from(new Set(sanitizedKeys));

    if (objectKeys.length === 0) {
      return NextResponse.json(
        { error: 'objectKey or objectKeys is required and must contain valid non-empty string(s).' },
        { status: 400 }
      );
    }

    if (objectKeys.length > 100) {
      return NextResponse.json(
        { error: 'Batch deletion exceeds the maximum limit of 100 keys per request.' },
        { status: 400 }
      );
    }

    // Sanitize keys to prevent path traversal or malicious paths
    for (const key of objectKeys) {
      if (
        key.includes('..') ||
        key.startsWith('/') ||
        key.includes('\0') ||
        key.includes('\\')
      ) {
        return NextResponse.json(
          { error: 'Invalid object key format.' },
          { status: 400 }
        );
      }
    }

    // 3. Authorize and verify ownership
    const isAdmin = authUser.role === 'ADMIN';

    if (!isAdmin) {
      await connectToDatabase();

      // Determine which database records reference ANY of the requested keys
      const properties = await PropertyModel.find(
        {
          $or: [
            { 'images.objectKey': { $in: objectKeys } },
            { 'video.objectKey': { $in: objectKeys } },
            { 'documents.objectKey': { $in: objectKeys } },
          ],
        },
        {
          _id: 1,
          sellerId: 1,
          'images.objectKey': 1,
          'video.objectKey': 1,
          'documents.objectKey': 1,
        }
      ).lean();

      // Identify all keys confirmed to belong to the authenticated user's own properties
      const authorizedKeys = new Set<string>();

      for (const prop of properties) {
        const isOwner = String(prop.sellerId) === String(authUser.id);

        if (isOwner) {
          if (Array.isArray(prop.images)) {
            for (const img of prop.images) {
              if (img?.objectKey && objectKeys.includes(img.objectKey)) {
                authorizedKeys.add(img.objectKey);
              }
            }
          }
          if (prop.video?.objectKey && objectKeys.includes(prop.video.objectKey)) {
            authorizedKeys.add(prop.video.objectKey);
          }
          if (Array.isArray(prop.documents)) {
            for (const doc of prop.documents) {
              if (doc?.objectKey && objectKeys.includes(doc.objectKey)) {
                authorizedKeys.add(doc.objectKey);
              }
            }
          }
        }
      }

      // Verify that EVERY requested key belongs to the authenticated user's property context
      const allAuthorized = objectKeys.every((key) => authorizedKeys.has(key));

      if (!allAuthorized) {
        // If even ONE requested objectKey is not authorized:
        // - do NOT delete ANY requested object from R2 storage.
        // - return HTTP 403.
        // - do not reveal whether another user's objectKey exists.
        return NextResponse.json(
          { error: 'Forbidden: You are not authorized to delete the requested asset(s).' },
          { status: 403 }
        );
      }
    }

    // 4. Delete authorized assets from Cloudflare R2 storage
    await deleteFilesFromStorage(objectKeys);

    // 5. Update database references after storage deletion
    await connectToDatabase();

    const sellerFilter = isAdmin ? {} : { sellerId: authUser.id };

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
