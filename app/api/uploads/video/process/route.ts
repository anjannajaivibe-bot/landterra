import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  requireAuth,
} from '@/lib/security/auth';

import {
  deleteFileFromStorage,
  downloadFileFromStorage,
  uploadFileToStorage,
} from '@/services/upload.service';

import {
  transcodeVideoToWebM,
} from '@/services/video.service';

export const maxDuration =
  60;

export const dynamic =
  'force-dynamic';

export async function POST(
  req: NextRequest,
) {
  const authUser =
    await requireAuth(req);

  if (
    authUser instanceof
    NextResponse
  ) {
    return authUser;
  }

  let validatedRawKey =
    '';

  try {
    const body =
      await req.json();

    const rawKey =
      typeof body.rawKey ===
      'string'
        ? body.rawKey.trim()
        : '';

    const fileName =
      typeof body.fileName ===
      'string'
        ? body.fileName.trim()
        : 'video.mp4';

    if (!rawKey) {
      return NextResponse.json(
        {
          error:
            'rawKey is required',
        },
        {
          status: 400,
        },
      );
    }

    const expectedPrefix =
      `temp/raw-videos/${authUser.id}/`;

    /*
     * The upload-ticket route creates a user-scoped temporary key.
     * Only that authenticated user's key can be processed or deleted.
     */
    if (
      rawKey.includes('..') ||
      rawKey.includes('\\') ||
      !rawKey.startsWith(
        expectedPrefix,
      )
    ) {
      return NextResponse.json(
        {
          error:
            'This video upload does not belong to the authenticated account.',
        },
        {
          status: 403,
        },
      );
    }

    validatedRawKey =
      rawKey;

    const rawBuffer =
      await downloadFileFromStorage(
        validatedRawKey,
      );

    if (
      !rawBuffer.length
    ) {
      return NextResponse.json(
        {
          error:
            'Raw video file is empty',
        },
        {
          status: 400,
        },
      );
    }

    const transcodeResult =
      await transcodeVideoToWebM(
        rawBuffer,
        fileName,
        {
          maxDurationSec:
            90,
          targetWidth:
            1280,
        },
      );

    const uploadResult =
      await uploadFileToStorage(
        transcodeResult.buffer,
        transcodeResult.fileName,
        transcodeResult.mimeType,
        false,
        `properties/videos/${authUser.id}`,
      );

    await deleteFileFromStorage(
      validatedRawKey,
    );

    validatedRawKey =
      '';

    return NextResponse.json(
      {
        success: true,
        file: {
          objectKey:
            uploadResult.objectKey,
          secureUrl:
            uploadResult.secureUrl,
          fileName:
            transcodeResult.fileName,
          size:
            transcodeResult.size,
          originalSize:
            transcodeResult.originalSize,
          compressionRatio:
            transcodeResult.compressionRatio,
          mimeType:
            uploadResult.mimeType ||
            transcodeResult.mimeType,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    console.error(
      'Video transcoding & processing error:',
      error,
    );

    if (
      validatedRawKey
    ) {
      await deleteFileFromStorage(
        validatedRawKey,
      ).catch(() => false);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Video processing failed',
      },
      {
        status: 500,
      },
    );
  }
}
