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
    const inputBuffer = Buffer.from(arrayBuffer) as Buffer;

    if (!inputBuffer.length) {
      return NextResponse.json(
        { error: 'Uploaded video file is empty.' },
        { status: 400 }
      );
    }

    // 1. Attempt to transcode and compress video to WebM using backend ffmpeg
    let uploadBuffer: Buffer = inputBuffer;
    let finalFileName = file.name;
    let finalMimeType = file.type || 'video/mp4';
    const originalSize = inputBuffer.length;
    let finalSize = inputBuffer.length;
    let compressionRatio = 0;

    try {
      const transcodeResult = await transcodeVideoToWebM(inputBuffer, file.name, {
        maxDurationSec: 90,
        targetWidth: 1280,
      });
      uploadBuffer = transcodeResult.buffer;
      finalFileName = transcodeResult.fileName;
      finalMimeType = transcodeResult.mimeType || 'video/webm';
      finalSize = transcodeResult.size;
      compressionRatio = transcodeResult.compressionRatio;
    } catch (ffmpegErr) {
      console.warn(
        'FFmpeg transcoding unavailable or failed, falling back to uploading original video file:',
        ffmpegErr
      );
      // Clean up fallback filename to avoid special characters
      finalFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    }

    // 2. Upload file to storage (under properties)
    const uploadResult = await uploadFileToStorage(
      uploadBuffer,
      finalFileName,
      finalMimeType,
      false,
      'properties'
    );

    return NextResponse.json(
      {
        success: true,
        file: {
          objectKey: uploadResult.objectKey,
          secureUrl: uploadResult.secureUrl,
          fileName: finalFileName,
          size: finalSize,
          originalSize,
          compressionRatio,
          mimeType: finalMimeType,
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
