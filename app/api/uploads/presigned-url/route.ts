import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/security/auth';

import {
  generateUploadTicket,
} from '@/services/upload.service';

const MAX_IMAGE_BYTES = 900 * 1024;
const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

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

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/avi',
  'video/x-matroska',
  'video/x-msvideo',
  'video/msvideo',
]);

export async function POST(req: NextRequest) {
  const authUser = await requireAuth(req);

  if (authUser instanceof NextResponse) {
    return authUser;
  }

  try {
    const body = await req.json();

    const fileName =
      typeof body.fileName === 'string'
        ? body.fileName.trim()
        : '';

    const mimeType =
      typeof body.mimeType === 'string'
        ? body.mimeType.trim().toLowerCase()
        : '';

    const isPrivate = body.isPrivate === true;

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      );
    }

    if (!mimeType) {
      return NextResponse.json(
        { error: 'mimeType is required' },
        { status: 400 }
      );
    }

    const isImage = ALLOWED_IMAGE_TYPES.has(mimeType);
    const isVideo = ALLOWED_VIDEO_TYPES.has(mimeType) || mimeType.startsWith('video/');
    const isDocument = ALLOWED_DOCUMENT_TYPES.has(mimeType);

    if (!isImage && !isVideo && !isDocument) {
      return NextResponse.json(
        {
          error: `Unsupported file format "${mimeType}". Allowed formats: JPG, PNG, WEBP, PDF, MP4, MOV, WEBM.`,
        },
        { status: 400 }
      );
    }

    if ((isImage || isVideo) && isPrivate) {
      return NextResponse.json(
        {
          error: 'Property media cannot be uploaded as private files.',
        },
        { status: 400 }
      );
    }

    const maxBytes = isVideo
      ? MAX_VIDEO_BYTES
      : isImage
        ? MAX_IMAGE_BYTES
        : MAX_DOCUMENT_BYTES;

    const folder =
      typeof body.folder === 'string' && body.folder.trim()
        ? body.folder.trim()
        : 'properties';

    const ticket = await generateUploadTicket(
      fileName,
      mimeType,
      isPrivate,
      {
        maxBytes,
        folder,
      }
    );

    return NextResponse.json(
      {
        ...ticket,
        constraints: {
          maxBytes,
          maxSize: isVideo ? '50MB' : isImage ? '900KB' : '25MB',
          isImage,
          isVideo,
          isPrivate,
        },
      },
      { status: 200 }
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