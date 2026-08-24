import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/security/auth';

import {
  generateUploadTicket,
} from '@/services/upload.service';

const MAX_IMAGE_BYTES =
  900 * 1024;

const MAX_DOCUMENT_BYTES =
  25 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
  new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]);

const ALLOWED_DOCUMENT_TYPES =
  new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]);

export async function POST(
  req: NextRequest,
) {
  const authUser =
    await requireAuth(req);

  if (
    authUser instanceof NextResponse
  ) {
    return authUser;
  }

  try {
    const body =
      await req.json();

    const fileName =
      typeof body.fileName ===
      'string'
        ? body.fileName.trim()
        : '';

    const mimeType =
      typeof body.mimeType ===
      'string'
        ? body.mimeType.trim().toLowerCase()
        : '';

    const isPrivate =
      body.isPrivate === true;

    if (!fileName) {
      return NextResponse.json(
        {
          error:
            'fileName is required',
        },
        {
          status: 400,
        },
      );
    }

    if (!mimeType) {
      return NextResponse.json(
        {
          error:
            'mimeType is required',
        },
        {
          status: 400,
        },
      );
    }

    const isImage =
      ALLOWED_IMAGE_TYPES.has(
        mimeType,
      );

    const isDocument =
      ALLOWED_DOCUMENT_TYPES.has(
        mimeType,
      );

    if (!isDocument) {
      return NextResponse.json(
        {
          error:
            `Unsupported file format "${mimeType}". ` +
            'Allowed formats: JPG, PNG, WEBP, PDF.',
        },
        {
          status: 400,
        },
      );
    }

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

    const maxBytes = isImage
      ? MAX_IMAGE_BYTES
      : MAX_DOCUMENT_BYTES;

    /*
     * The upload service should use this limit when creating
     * the signed/presigned upload request.
     *
     * The browser must still compress images before requesting
     * the ticket.
     */

    const ticket =
      await generateUploadTicket(
        fileName,
        mimeType,
        isPrivate,
        {
          maxBytes,
        },
      );

    return NextResponse.json(
      {
        ...ticket,

        constraints: {
          maxBytes,
          maxSize:
            isImage
              ? '900KB'
              : '25MB',
          isImage,
          isPrivate,
        },
      },
      {
        status: 200,
      },
    );
  } catch (err: unknown) {
    console.error(
      'Presigned upload ticket error:',
      err,
    );

    const message =
      err instanceof Error
        ? err.message
        : 'Failed to generate upload ticket';

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