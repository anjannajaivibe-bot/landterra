import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canAccessDocument } from '@/lib/security/auth';
import { getSignedDocumentDownloadUrl, isR2Configured } from '@/lib/r2/client';
import { PropertyModel } from '@/models/Property';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key || typeof key !== 'string' || !key.trim()) {
    return NextResponse.json({ error: 'Document key required' }, { status: 400 });
  }

  // Authorization check: ADMIN has access to verify documents,
  // otherwise only the property owner who uploaded the document has access.
  if (authUser.role !== 'ADMIN') {
    try {
      const connection = await connectToDatabase();
      if (!connection) {
        return NextResponse.json(
          { error: 'Database connection failed. Unable to verify document authorization.' },
          { status: 500 }
        );
      }

      const property = await PropertyModel.findOne({
        'documents.objectKey': key.trim(),
      }).lean();

      if (!property) {
        return NextResponse.json(
          { error: 'Document not found or unauthorized.' },
          { status: 404 }
        );
      }

      const hasAccess = canAccessDocument(
        { id: authUser.id, role: authUser.role },
        property.sellerId
      );

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to access this document.' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Failed to verify document authorization.' },
        { status: 500 }
      );
    }
  }

  if (isR2Configured()) {
    const signedUrl = await getSignedDocumentDownloadUrl(key, 900); // 15 mins expiry
    if (signedUrl) {
      return NextResponse.redirect(signedUrl);
    }
  }

  return NextResponse.json(
    {
      error: 'Cloudflare R2 storage is not configured. Document cannot be downloaded.',
    },
    { status: 503 }
  );
}
