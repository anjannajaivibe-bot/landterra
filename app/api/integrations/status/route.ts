import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  isGoogleOAuthConfigured,
} from '@/lib/auth/google-oauth';

import {
  isMongoConfigured,
} from '@/lib/db/mongodb';

import {
  isResendConfigured,
} from '@/lib/email/client';

import {
  isGoogleMapsConfigured,
} from '@/lib/maps/client';

import {
  isR2Configured,
} from '@/lib/r2/client';

import {
  requireRole,
} from '@/lib/security/auth';

export const dynamic =
  'force-dynamic';

export async function GET(
  req: NextRequest,
) {
  const adminUser =
    await requireRole(
      req,
      ['ADMIN'],
    );

  if (
    adminUser instanceof
    NextResponse
  ) {
    return adminUser;
  }

  const status = {
    mongodb: {
      name:
        'MongoDB Atlas',
      configured:
        isMongoConfigured(),
      description:
        'Persistent database for users, listings, enquiries and audit logs',
    },

    r2: {
      name:
        'Cloudflare R2 Storage',
      configured:
        isR2Configured(),
      description:
        'Object storage for property media and private verification documents',
    },

    googleOAuth: {
      name:
        'Google OAuth',
      configured:
        isGoogleOAuthConfigured(),
      description:
        'Secure Google sign-in for buyer and seller accounts',
    },

    googleMaps: {
      name:
        'Google Maps Platform',
      configured:
        isGoogleMapsConfigured(),
      description:
        'Interactive property location and map features',
    },

    resend: {
      name:
        'Resend Email Service',
      configured:
        isResendConfigured(),
      description:
        'Transactional email delivery',
    },
  };

  return NextResponse.json(
    {
      status,
      allConfigured:
        Object.values(
          status,
        ).every(
          (service) =>
            service.configured,
        ),
    },
    {
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate',
      },
    },
  );
}
