import {
  isR2Configured,
  getPresignedUploadUrl,
  getSignedDocumentDownloadUrl,
  getR2Client,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} from '@/lib/r2/client';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
} from '@aws-sdk/client-s3';
import { connectToDatabase } from '@/lib/db/mongodb';
import { PropertyModel } from '@/models/Property';

export interface UploadResult {
  objectKey: string;
  secureUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  isPrivate: boolean;
}

/**
 * Detect the genuine file MIME type from initial magic bytes binary signatures.
 * Protects against MIME-type spoofing, polyglot files, and executable injection.
 */
export function detectBufferMimeType(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 (0x89 'P' 'N' 'G')
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  // PDF: %PDF- (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  // WebM / Matroska (MKV): 1A 45 DF A3
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return 'video/webm';
  }

  // MP4 / MOV / M4V / QuickTime: .... ftyp
  if (
    buffer.length >= 8 &&
    buffer.toString('ascii', 4, 8) === 'ftyp'
  ) {
    return 'video/mp4';
  }

  return null;
}

/**
 * Validate that the binary content matches legitimate media and document formats.
 */
export function validateUploadBuffer(
  buffer: Buffer,
  declaredMime: string,
  isPrivate: boolean
): string {
  const detected = detectBufferMimeType(buffer);

  if (isPrivate) {
    const allowedDocs = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!detected || !allowedDocs.includes(detected)) {
      throw new Error(
        'Invalid or unsupported document format. File binary does not match an authentic PDF, JPEG, or PNG document.'
      );
    }
    return detected;
  }

  const isVideo = declaredMime.startsWith('video/');
  if (isVideo) {
    const allowedVideos = ['video/mp4', 'video/webm'];
    if (!detected || !allowedVideos.includes(detected)) {
      throw new Error(
        'Invalid video format. File binary does not match an authentic MP4 or WebM video stream.'
      );
    }
    return detected;
  }

  const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
  if (!detected || !allowedImages.includes(detected)) {
    throw new Error(
      'Invalid image format. File binary does not match an authentic JPEG, PNG, or WebP photograph.'
    );
  }

  return detected;
}

/**
 * Handle upload of image or document with type/size validation and R2 integration
 */
export async function uploadFileToStorage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  isPrivate = false,
  folder = 'properties'
): Promise<UploadResult> {
  // Validate authentic magic bytes to prevent MIME-spoofing
  const verifiedMimeType = validateUploadBuffer(fileBuffer, mimeType, isPrivate);

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const subfolder = isPrivate
    ? 'documents'
    : verifiedMimeType.startsWith('video/')
      ? 'videos'
      : 'images';
  const objectKey = folder.includes('/')
    ? `${folder}/${timestamp}_${randomStr}_${sanitizedFileName}`
    : `${folder}/${subfolder}/${timestamp}_${randomStr}_${sanitizedFileName}`;

  // If Cloudflare R2 is configured, upload directly to R2 bucket
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 storage is not configured. Please configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in your environment.');
  }

  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 client initialization failed.');
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
    Body: fileBuffer,
    ContentType: verifiedMimeType,
    ContentDisposition: 'inline',
  });

  await client.send(command);

  const publicBase = R2_PUBLIC_URL || '';
  const secureUrl = isPrivate
    ? `/api/documents/download?key=${encodeURIComponent(objectKey)}`
    : `${publicBase.replace(/\/$/, '')}/${objectKey}`;

  return {
    objectKey,
    secureUrl,
    fileName,
    mimeType: verifiedMimeType,
    size: fileBuffer.length,
    isPrivate,
  };
}

/**
 * Request presigned upload URL for direct client-to-R2 upload
 */
export async function generateUploadTicket(
  fileName: string,
  mimeType: string,
  isPrivate = false,
  options?: { maxBytes?: number; folder?: string }
) {
  const allowedMimes = isPrivate
    ? ['application/pdf', 'image/jpeg', 'image/png']
    : [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/jpg',
        'video/mp4',
        'video/quicktime',
        'video/webm',
        'video/x-matroska',
      ];

  if (!allowedMimes.includes(mimeType.toLowerCase())) {
    throw new Error(`Unsupported upload MIME type: ${mimeType}. Only verified image, video, and PDF documents are permitted.`);
  }

  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 storage is not configured. Please set R2 credentials.');
  }

  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const baseFolder = options?.folder || 'properties';
  const subfolder = isPrivate
    ? 'documents'
    : mimeType.startsWith('video/')
      ? 'videos'
      : 'images';
  const objectKey = baseFolder.includes('/')
    ? `${baseFolder}/${timestamp}_${randomStr}_${sanitized}`
    : `${baseFolder}/${subfolder}/${timestamp}_${randomStr}_${sanitized}`;

  const ticket = await getPresignedUploadUrl(objectKey, mimeType);
  if (!ticket) {
    throw new Error('Failed to generate Cloudflare R2 presigned URL.');
  }

  return {
    ...ticket,
    maxBytes: options?.maxBytes,
    isR2: true,
  };
}

/**
 * Get secure download URL for a private document
 */
export async function getDocumentAccessUrl(objectKey: string): Promise<string> {
  if (isR2Configured()) {
    const signedUrl = await getSignedDocumentDownloadUrl(objectKey, 900); // 15 mins
    if (signedUrl) return signedUrl;
  }
  return `/api/documents/download?key=${encodeURIComponent(objectKey)}`;
}

/**
 * Download a file from Cloudflare R2 into a Buffer
 */
export async function downloadFileFromStorage(objectKey: string): Promise<Buffer> {
  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 client is not configured.');
  }

  const response = await client.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    })
  );

  if (!response.Body) {
    throw new Error(`File at ${objectKey} is empty or not found.`);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFileFromStorage(objectKey: string): Promise<boolean> {
  const client = getR2Client();
  if (!client || !objectKey) return false;
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
      })
    );
    return true;
  } catch (err) {
    console.warn('Failed to delete file from storage:', objectKey, err);
    return false;
  }
}

/**
 * Bulk delete files from Cloudflare R2
 */
export async function deleteFilesFromStorage(objectKeys: string[]): Promise<boolean> {
  if (!objectKeys || objectKeys.length === 0) return true;
  const client = getR2Client();
  if (!client) return false;

  const validKeys = objectKeys.filter((k) => typeof k === 'string' && k.trim().length > 0);
  if (validKeys.length === 0) return true;

  try {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET_NAME,
        Delete: {
          Objects: validKeys.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
    return true;
  } catch (err) {
    console.warn('Bulk delete failed, falling back to individual deletes:', err);
    await Promise.allSettled(validKeys.map((key) => deleteFileFromStorage(key)));
    return true;
  }
}

/* ================================================================
   ORPHANED R2 UPLOADS CLEANUP (B-2)
================================================================ */

export interface CleanupOrphanedUploadsOptions {
  olderThanHours?: number; // default 24 hours
  prefix?: string;         // default 'properties/'
  dryRun?: boolean;        // default false
  maxKeys?: number;        // default 5000
}

export interface CleanupResult {
  totalScanned: number;
  olderThanCutoffCount: number;
  referencedCount: number;
  orphanedCount: number;
  deletedCount: number;
  orphanedKeys: string[];
  dryRun: boolean;
  message: string;
}

/**
 * Scan R2 storage for files not referenced by any MongoDB property document.
 * Files created within the cutoff window (default 24 hours) are preserved to
 * avoid deleting active in-flight user uploads before the property form is submitted.
 */
export async function cleanupOrphanedUploads(
  options: CleanupOrphanedUploadsOptions = {}
): Promise<CleanupResult> {
  const {
    olderThanHours = 24,
    prefix = 'properties/',
    dryRun = false,
    maxKeys = 5000,
  } = options;

  if (!isR2Configured()) {
    return {
      totalScanned: 0,
      olderThanCutoffCount: 0,
      referencedCount: 0,
      orphanedCount: 0,
      deletedCount: 0,
      orphanedKeys: [],
      dryRun,
      message: 'Cloudflare R2 is not configured.',
    };
  }

  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 client initialization failed.');
  }

  // 1. Gather all referenced objectKeys across active (non-deleted) MongoDB properties
  await connectToDatabase();
  const properties = await PropertyModel.find(
    { listingStatus: { $ne: 'DELETED' } },
    { 'images.objectKey': 1, 'video.objectKey': 1, 'documents.objectKey': 1 }
  ).lean();

  const referencedKeys = new Set<string>();
  for (const p of properties) {
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (img?.objectKey && typeof img.objectKey === 'string') {
          referencedKeys.add(img.objectKey.trim());
        }
      }
    }
    if (p.video?.objectKey && typeof p.video.objectKey === 'string') {
      referencedKeys.add(p.video.objectKey.trim());
    }
    if (Array.isArray(p.documents)) {
      for (const doc of p.documents) {
        if (doc?.objectKey && typeof doc.objectKey === 'string') {
          referencedKeys.add(doc.objectKey.trim());
        }
      }
    }
  }

  // 2. Scan R2 bucket for objects older than cutoff
  const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
  let continuationToken: string | undefined = undefined;
  const orphanedKeys: string[] = [];
  let totalScanned = 0;
  let olderThanCutoffCount = 0;

  do {
    const listParams: ListObjectsV2CommandInput = {
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
      MaxKeys: Math.min(maxKeys - totalScanned, 1000),
    };

    const listRes = await client.send(new ListObjectsV2Command(listParams));

    if (listRes.Contents) {
      for (const item of listRes.Contents) {
        if (!item.Key) continue;
        totalScanned++;
        const lastModified = item.LastModified ? item.LastModified.getTime() : 0;
        if (lastModified < cutoffTime) {
          olderThanCutoffCount++;
          if (!referencedKeys.has(item.Key)) {
            orphanedKeys.push(item.Key);
          }
        }
      }
    }

    continuationToken = listRes.IsTruncated ? listRes.NextContinuationToken : undefined;
  } while (continuationToken && totalScanned < maxKeys);

  // 3. Delete orphaned objects if not a dry run
  let deletedCount = 0;
  if (!dryRun && orphanedKeys.length > 0) {
    const batchSize = 500;
    for (let i = 0; i < orphanedKeys.length; i += batchSize) {
      const batch = orphanedKeys.slice(i, i + batchSize);
      await deleteFilesFromStorage(batch);
      deletedCount += batch.length;
    }
  }

  return {
    totalScanned,
    olderThanCutoffCount,
    referencedCount: referencedKeys.size,
    orphanedCount: orphanedKeys.length,
    deletedCount: dryRun ? 0 : deletedCount,
    orphanedKeys: orphanedKeys.slice(0, 50),
    dryRun,
    message: dryRun
      ? `Dry run complete. Found ${orphanedKeys.length} orphaned objects older than ${olderThanHours} hours.`
      : `Cleaned up ${deletedCount} orphaned objects from R2 storage.`,
  };
}
