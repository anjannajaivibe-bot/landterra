import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { uploadFileToStorage } from '@/services/upload.service';

export async function POST(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const isPrivate = formData.get('isPrivate') === 'true';
    const folder = (formData.get('folder') as string) || 'properties';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Size limit: 25MB for docs, 10MB for images
    const maxBytes = isPrivate ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File exceeds maximum allowed size of ${isPrivate ? '25MB' : '10MB'}` },
        { status: 400 }
      );
    }

    // MIME type check
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file format ${file.type}. Allowed: JPG, PNG, WEBP, PDF` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFileToStorage(
      buffer,
      file.name,
      file.type,
      isPrivate,
      folder
    );

    return NextResponse.json({ success: true, file: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
