import { NextResponse } from 'next/server';
import { isMongoConfigured } from '@/lib/db/mongodb';
import { isR2Configured } from '@/lib/r2/client';
import { isGoogleMapsConfigured } from '@/lib/maps/client';
import { isResendConfigured } from '@/lib/email/client';

export async function GET() {
  const status = {
    mongodb: {
      name: 'MongoDB Atlas',
      configured: isMongoConfigured(),
      envVar: 'MONGODB_URI',
      description: 'Persistent document database for users, listings, enquiries and audit logs',
    },
    r2: {
      name: 'Cloudflare R2 Storage',
      configured: isR2Configured(),
      envVar: 'R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY',
      description: 'S3-compatible object storage for property images and private verification documents',
    },
    googleMaps: {
      name: 'Google Maps Platform',
      configured: isGoogleMapsConfigured(),
      envVar: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
      description: 'Interactive location picker, pin drop, and radius privacy maps',
    },
    resend: {
      name: 'Resend Email Service',
      configured: isResendConfigured(),
      envVar: 'RESEND_API_KEY',
      description: 'Transactional emails for verification approvals and seller enquiries',
    },
  };

  return NextResponse.json({
    status,
    allConfigured: Object.values(status).every((s) => s.configured),
  });
}
