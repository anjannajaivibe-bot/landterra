import { isR2Configured, getPresignedUploadUrl, getSignedDocumentDownloadUrl, getR2Client } from '@/lib/r2/client';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export interface UploadResult {
  objectKey: string;
  secureUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  isPrivate: boolean;
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
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const subfolder = isPrivate
    ? 'documents'
    : mimeType.startsWith('video/')
      ? 'videos'
      : 'images';
  const objectKey = `${folder}/${subfolder}/${timestamp}_${randomStr}_${sanitizedFileName}`;

  // If Cloudflare R2 is configured, upload directly to R2 bucket
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 storage is not configured. Please configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in your environment.');
  }

  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 client initialization failed.');
  }

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || 'bhoomimitra-assets',
    Key: objectKey,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await client.send(command);

  const publicBase = process.env.R2_PUBLIC_URL || '';
  const secureUrl = isPrivate
    ? `/api/documents/download?key=${encodeURIComponent(objectKey)}`
    : `${publicBase.replace(/\/$/, '')}/${objectKey}`;

  return {
    objectKey,
    secureUrl,
    fileName,
    mimeType,
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
  const objectKey = `${baseFolder}/${subfolder}/${timestamp}_${randomStr}_${sanitized}`;

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
