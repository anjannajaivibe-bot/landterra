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
} from '@aws-sdk/client-s3';

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
    ContentType: mimeType,
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
