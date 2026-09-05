import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { transcodeVideoToWebM } from '@/services/video.service';
import {
  downloadFileFromStorage,
  uploadFileToStorage,
  deleteFileFromStorage,
} from '@/services/upload.service';

export const maxDuration = 60; // Allow up to 60s for video transcoding on Vercel
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) {
    return authUser;
  }

  try {
    const body = await req.json();
    const rawKey = typeof body.rawKey === 'string' ? body.rawKey.trim() : '';
    const fileName = typeof body.fileName === 'string' ? body.fileName.trim() : 'video.mp4';

    if (!rawKey) {
      return NextResponse.json({ error: 'rawKey is required' }, { status: 400 });
    }

    // 1. Download the raw video buffer directly from R2
    const rawBuffer = await downloadFileFromStorage(rawKey);
    if (!rawBuffer.length) {
      return NextResponse.json({ error: 'Raw video file is empty' }, { status: 400 });
    }

    // 2. Transcode and compress video to WebM using backend FFmpeg
    const transcodeResult = await transcodeVideoToWebM(rawBuffer, fileName, {
      maxDurationSec: 90,
      targetWidth: 1280,
    });

    // 3. Upload the compressed WebM file to permanent properties/videos/ storage
    const uploadResult = await uploadFileToStorage(
      transcodeResult.buffer,
      transcodeResult.fileName,
      'video/webm',
      false,
      'properties'
    );

    // 4. Delete the temporary raw video from R2 to keep storage lightweight
    await deleteFileFromStorage(rawKey);

    return NextResponse.json(
      {
        success: true,
        file: {
          objectKey: uploadResult.objectKey,
          secureUrl: uploadResult.secureUrl,
          fileName: transcodeResult.fileName,
          size: transcodeResult.size,
          originalSize: transcodeResult.originalSize,
          compressionRatio: transcodeResult.compressionRatio,
          mimeType: 'video/webm',
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('Video transcoding & processing error:', err);
    // Cleanup temporary raw file on failure so it does not linger in R2
    try {
      const body = await req.clone().json().catch(() => null);
      if (body?.rawKey) {
        await deleteFileFromStorage(body.rawKey);
      }
    } catch {}

    const message = err instanceof Error ? err.message : 'Video processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
