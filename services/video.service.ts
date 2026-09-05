import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpegPath from 'ffmpeg-static';

export interface TranscodeResult {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  size: number;
  originalSize: number;
  compressionRatio: number;
}

/**
 * Resolves the absolute path to the ffmpeg executable.
 * Handles Next.js server bundling where __dirname is redirected to .next/server/vendor-chunks.
 */
function resolveFfmpegExecutable(): string {
  // 1. Explicit env variables
  if (process.env.FFMPEG_BIN && fs.existsSync(process.env.FFMPEG_BIN)) {
    return process.env.FFMPEG_BIN;
  }
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }

  // 2. Direct node_modules check relative to project root (process.cwd())
  const exeName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const nodeModulesPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', exeName);
  if (fs.existsSync(nodeModulesPath)) {
    return nodeModulesPath;
  }

  // 3. Check imported ffmpegPath if valid
  if (ffmpegPath && typeof ffmpegPath === 'string' && fs.existsSync(ffmpegPath)) {
    return ffmpegPath;
  }

  // 4. Also check relative to __dirname going up
  const candidateRelative = path.resolve(process.cwd(), '..', 'node_modules', 'ffmpeg-static', exeName);
  if (fs.existsSync(candidateRelative)) {
    return candidateRelative;
  }

  // 5. System PATH fallback
  return 'ffmpeg';
}

/**
 * Transcode and compress an uploaded video file into an optimized WebM (VP8/Vorbis).
 * - Caps maximum duration (default: 90 seconds)
 * - Scales down oversized 4K/high-res videos to 1280px width preserving aspect ratio
 * - Compresses video bitrate to ~1200 kbps for fast mobile playback
 */
export async function transcodeVideoToWebM(
  inputBuffer: Buffer,
  originalFileName: string,
  options?: {
    maxDurationSec?: number;
    targetWidth?: number;
  }
): Promise<TranscodeResult> {
  const resolvedFfmpegPath = resolveFfmpegExecutable();
  if (!resolvedFfmpegPath) {
    throw new Error('ffmpeg binary is not available on this server.');
  }

  const maxDuration = options?.maxDurationSec || 90;
  const targetWidth = options?.targetWidth || 1280;

  const tempId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const ext = path.extname(originalFileName) || '.mp4';
  const inputPath = path.join(os.tmpdir(), `upload_in_${tempId}${ext}`);
  const outputPath = path.join(os.tmpdir(), `upload_out_${tempId}.webm`);

  await fs.promises.writeFile(inputPath, inputBuffer);

  try {
    const args = [
      '-y',
      '-i', inputPath,
      '-t', String(maxDuration),
      '-vf', `scale='min(${targetWidth},iw)':-2`,
      '-c:v', 'libvpx',
      '-b:v', '1200k',
      '-crf', '12',
      '-quality', 'good',
      '-cpu-used', '4',
      '-map', '0:v:0',
      '-map', '0:a?',
      '-c:a', 'libvorbis',
      '-b:a', '96k',
      outputPath,
    ];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(resolvedFfmpegPath, args);
      let stderrData = '';

      proc.stderr.on('data', (chunk) => {
        stderrData += chunk.toString();
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to spawn ffmpeg: ${err.message}`));
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          console.error('[FFmpeg Error output]:', stderrData.slice(-1000));
          reject(new Error(`FFmpeg transcoding failed with code ${code}`));
        }
      });
    });

    const outputBuffer = await fs.promises.readFile(outputPath);
    const parsedName = path.parse(originalFileName);
    const webmFileName = `${parsedName.name || 'property_video'}.webm`;
    const compressionRatio = Number(
      ((1 - outputBuffer.length / inputBuffer.length) * 100).toFixed(1)
    );

    return {
      buffer: outputBuffer,
      fileName: webmFileName,
      mimeType: 'video/webm',
      size: outputBuffer.length,
      originalSize: inputBuffer.length,
      compressionRatio: Math.max(0, compressionRatio),
    };
  } finally {
    // Clean up temporary files
    try {
      if (fs.existsSync(inputPath)) {
        await fs.promises.unlink(inputPath);
      }
    } catch (e) {
      console.error('Failed to unlink input temp file:', e);
    }

    try {
      if (fs.existsSync(outputPath)) {
        await fs.promises.unlink(outputPath);
      }
    } catch (e) {
      console.error('Failed to unlink output temp file:', e);
    }
  }
}
