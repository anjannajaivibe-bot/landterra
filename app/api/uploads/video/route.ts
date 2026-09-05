import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { transcodeVideoToWebM } from '@/services/video.service';
import { uploadFileToStorage } from '@/services/upload.service';

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/avi',
  'video/msvideo',
  'video/x-msvideo',
]);

export async function POST(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) {
    return authUser;
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    if (!ALLOWED_VIDEO_TYPES.has(file.type) && !file.name.match(/\.(mp4|mov|webm|mkv|avi)$/i)) {
      return NextResponse.json(
        {
          error: `Unsupported video format "${file.type || file.name}". Allowed formats: MP4, MOV, WebM, MKV, AVI.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        {
          error: 'Video exceeds the maximum allowed size of 50 MB. Please upload a shorter or smaller clip (under 60-90s).',
          maxBytes: MAX_VIDEO_BYTES,
          fileSize: file.size,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    if (!inputBuffer.length) {
      return NextResponse.json(
        { error: 'Uploaded video file is empty.' },
        { status: 400 }
      );
    }

    // 1. Transcode and compress video to WebM using backend ffmpeg
    const transcodeResult = await transcodeVideoToWebM(inputBuffer, file.name, {
      maxDurationSec: 90,
      targetWidth: 1280,
    });

    // 2. Upload transcoded WebM file to storage (under properties/videos)
    const uploadResult = await uploadFileToStorage(
      transcodeResult.buffer,
      transcodeResult.fileName,
      'video/webm',
      false,
      'properties'
    );

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
    console.error('Video transcoding & upload error:', err);
    const message = err instanceof Error ? err.message : 'Video processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
