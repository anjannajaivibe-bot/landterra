import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/security/auth';
import { uploadFileToStorage } from '@/services/upload.service';

const MAX_IMAGE_BYTES = 900 * 1024;
const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export async function POST(req: NextRequest) {
  const authUser = await requireAuth(req);

  if (authUser instanceof NextResponse) {
    return authUser;
  }

  try {
    const formData = await req.formData();

    const file = formData.get('file');

    const isPrivate =
      formData.get('isPrivate') === 'true';

    const folder =
      String(
        formData.get('folder') || 'properties',
      ).trim() || 'properties';

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: 'No valid file provided',
        },
        {
          status: 400,
        },
      );
    }

    const isImage = ALLOWED_IMAGE_TYPES.has(
      file.type,
    );

    const isDocument =
      ALLOWED_DOCUMENT_TYPES.has(
        file.type,
      );

    if (!isDocument) {
      return NextResponse.json(
        {
          error:
            `Unsupported file format "${file.type}". ` +
            'Allowed formats: JPG, PNG, WEBP, PDF.',
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ============================================================
     * SERVER-SIDE SIZE VALIDATION
     * ============================================================
     *
     * Images:
     *   Maximum 900 KB
     *
     * Documents:
     *   Maximum 25 MB
     *
     * The browser compression is only a convenience.
     * The server remains authoritative.
     */

    const maxBytes = isImage
      ? MAX_IMAGE_BYTES
      : MAX_DOCUMENT_BYTES;

    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: isImage
            ? 'Image exceeds the maximum allowed size of 900 KB. Please use a smaller or more compressed image.'
            : 'Document exceeds the maximum allowed size of 25 MB.',
          maxBytes,
          fileSize: file.size,
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ============================================================
     * IMAGE-SPECIFIC VALIDATION
     * ============================================================
     */

    if (isImage && isPrivate) {
      return NextResponse.json(
        {
          error:
            'Property images cannot be uploaded as private files.',
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ============================================================
     * READ FILE
     * ============================================================
     */

    const arrayBuffer =
      await file.arrayBuffer();

    const buffer = Buffer.from(
      arrayBuffer,
    );

    if (!buffer.length) {
      return NextResponse.json(
        {
          error: 'The uploaded file is empty.',
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ============================================================
     * UPLOAD
     * ============================================================
     */

    const result =
      await uploadFileToStorage(
        buffer,
        file.name,
        file.type,
        isPrivate,
        folder,
      );

    return NextResponse.json(
      {
        success: true,
        file: result,
        uploadedSize: file.size,
        optimized:
          isImage
            ? file.size <=
              MAX_IMAGE_BYTES
            : false,
      },
      {
        status: 200,
      },
    );
  } catch (err: unknown) {
    console.error(
      'Direct upload error:',
      err,
    );

    const message =
      err instanceof Error
        ? err.message
        : 'Upload failed';

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}