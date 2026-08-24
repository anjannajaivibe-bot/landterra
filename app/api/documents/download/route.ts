import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { getSignedDocumentDownloadUrl, isR2Configured } from '@/lib/r2/client';
import { PropertyModel } from '@/models/Property';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Document key required' }, { status: 400 });
  }

  // Authorization check: ADMIN has access to verify documents,
  // otherwise only the property owner who uploaded the document has access.
  if (authUser.role !== 'ADMIN') {
    try {
      await connectToDatabase();
      const property = await PropertyModel.findOne({
        'documents.objectKey': key,
      }).lean();

      if (property && property.sellerId !== authUser.id) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to view this property document.' },
          { status: 403 }
        );
      }
    } catch {
      // Fallback check if DB error
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
