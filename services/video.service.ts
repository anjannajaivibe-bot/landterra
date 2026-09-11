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
  let resolved: string | null = null;
  const exeName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';

  // 1. Explicit env variables
  if (process.env.FFMPEG_BIN && fs.existsSync(process.env.FFMPEG_BIN)) {
    resolved = process.env.FFMPEG_BIN;
  } else if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    resolved = process.env.FFMPEG_PATH;
  } else {
    // 2. Direct node_modules check relative to project root (process.cwd())
    const nodeModulesPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', exeName);
    if (fs.existsSync(nodeModulesPath)) {
      resolved = nodeModulesPath;
    } else if (ffmpegPath && typeof ffmpegPath === 'string' && fs.existsSync(ffmpegPath)) {
      // 3. Check imported ffmpegPath if valid
      resolved = ffmpegPath;
    } else {
      // 4. Also check relative to __dirname going up
      const candidateRelative = path.resolve(process.cwd(), '..', 'node_modules', 'ffmpeg-static', exeName);
      if (fs.existsSync(candidateRelative)) {
        resolved = candidateRelative;
      }
    }
  }

  const finalPath = resolved || 'ffmpeg';
  if (process.platform !== 'win32' && fs.existsSync(finalPath)) {
    try {
      fs.chmodSync(finalPath, 0o755);
    } catch {}
  }
  return finalPath;
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
    timeoutMs?: number;
  }
): Promise<TranscodeResult> {
  const maxDuration = options?.maxDurationSec || 90;
  const targetWidth = options?.targetWidth || 1280;
  const timeoutMs = options?.timeoutMs || 45000;

  const tempId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const ext = path.extname(originalFileName) || '.mp4';
  const inputPath = path.join(os.tmpdir(), `upload_in_${tempId}${ext}`);
  const outputPath = path.join(os.tmpdir(), `upload_out_${tempId}.webm`);

  await fs.promises.writeFile(inputPath, inputBuffer);

  try {
    let resolvedFfmpegPath: string | null = null;
    try {
      resolvedFfmpegPath = resolveFfmpegExecutable();
    } catch {
      resolvedFfmpegPath = null;
    }

    if (!resolvedFfmpegPath) {
      throw new Error('ffmpeg binary is not available on this server environment.');
    }

    const args = [
      '-y',
      '-threads', '2', // Cap worker threads to prevent host CPU starvation
      '-i', inputPath,
      '-t', String(maxDuration),
      '-vf', `scale='min(${targetWidth},iw)':-2`,
      '-c:v', 'libvpx',
      '-b:v', '1200k',
      '-quality', 'realtime',
      '-cpu-used', '8',
      '-map', '0:v:0',
      '-map', '0:a?',
      '-c:a', 'libvorbis',
      '-b:a', '96k',
      outputPath,
    ];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(resolvedFfmpegPath!, args);
      let stderrData = '';
      let isSettled = false;

      // Watchdog timeout to terminate hung processes and prevent zombie ffmpeg tasks
      const watchdogTimer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            proc.kill('SIGKILL');
          } catch {}
          reject(new Error(`FFmpeg transcoding timed out after ${Math.round(timeoutMs / 1000)}s`));
        }
      }, timeoutMs);

      proc.stderr.on('data', (chunk) => {
        stderrData += chunk.toString();
      });

      proc.on('error', (err) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(watchdogTimer);
          reject(new Error(`Failed to spawn ffmpeg: ${err.message}`));
        }
      });

      proc.on('close', (code) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(watchdogTimer);
          if (code === 0) {
            resolve();
          } else {
            console.error('[FFmpeg Error output]:', stderrData.slice(-1000));
            reject(new Error(`FFmpeg transcoding failed with exit code ${code}`));
          }
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
  } catch (err: unknown) {
    console.warn(
      '[video.service] FFmpeg transcoding failed or timed out, applying graceful fallback to preserve video:',
      err instanceof Error ? err.message : err
    );
    // Graceful fallback: preserve the original uploaded video stream rather than aborting upload
    const parsedName = path.parse(originalFileName);
    const fallbackExt = ext.toLowerCase() === '.webm' ? '.webm' : '.mp4';
    const fallbackMime = ext.toLowerCase() === '.webm' ? 'video/webm' : 'video/mp4';

    return {
      buffer: inputBuffer,
      fileName: `${parsedName.name || 'property_video'}${fallbackExt}`,
      mimeType: fallbackMime,
      size: inputBuffer.length,
      originalSize: inputBuffer.length,
      compressionRatio: 0,
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
