import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
}

const R2_ACCOUNT_ID = cleanEnv(process.env.R2_ACCOUNT_ID);
const R2_ACCESS_KEY_ID = cleanEnv(process.env.R2_ACCESS_KEY_ID);
const R2_SECRET_ACCESS_KEY = cleanEnv(process.env.R2_SECRET_ACCESS_KEY);
const R2_BUCKET_NAME = cleanEnv(process.env.R2_BUCKET_NAME) || 'bhoomimitra-assets';
const R2_PUBLIC_URL = cleanEnv(process.env.R2_PUBLIC_URL || process.env.R2_PUBLIC_DOMAIN);

export function isR2Configured(): boolean {
  return Boolean(
    R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    !R2_ACCESS_KEY_ID.includes('your-')
  );
}

let s3ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client | null {
  if (!isR2Configured()) {
    return null;
  }

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  return s3ClientInstance;
}

/**
 * Generate a pre-signed PUT URL for direct client-to-R2 upload
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900 // 15 mins
): Promise<{ uploadUrl: string; key: string; publicUrl?: string } | null> {
  const client = getR2Client();
  if (!client) return null;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}` : undefined;

  return { uploadUrl, key, publicUrl };
}

/**
 * Generate a signed GET URL for secure access to private documents
 */
export async function getSignedDocumentDownloadUrl(
  key: string,
  expiresIn = 900 // 15 mins
): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn });
}
