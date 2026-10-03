import crypto from 'crypto';

import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  getAuthUser,
  setSessionCookie,
} from '@/lib/security/auth';

import {
  checkRateLimit,
} from '@/lib/security/rate-limit';

import {
  connectToDatabase,
} from '@/lib/db/mongodb';

import {
  UserModel,
} from '@/models/User';

const ADMIN_LOGIN_LIMIT =
  5;

const ADMIN_LOGIN_WINDOW_MS =
  15 * 60 * 1000;

function timingSafeStringEqual(
  left: string,
  right: string,
): boolean {
  const leftBuffer =
    Buffer.from(left);

  const rightBuffer =
    Buffer.from(right);

  if (
    leftBuffer.length !==
    rightBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    leftBuffer,
    rightBuffer,
  );
}

function getClientIp(
  req: NextRequest,
): string {
  return (
    req.headers
      .get('x-forwarded-for')
      ?.split(',')[0]
      ?.trim() ||
    req.headers.get(
      'x-real-ip',
    ) ||
    'unknown'
  );
}

export async function POST(
  req: NextRequest,
) {
  try {
    const ipAddress =
      getClientIp(req);

    const ipRateLimit =
      await checkRateLimit(
        `admin-login-ip:${ipAddress}`,
        ADMIN_LOGIN_LIMIT,
        ADMIN_LOGIN_WINDOW_MS,
      );

    if (
      !ipRateLimit.allowed
    ) {
      return NextResponse.json(
        {
          error:
            'Too many admin sign-in attempts. Please wait before trying again.',
        },
        {
          status: 429,
          headers: {
            'Retry-After':
              String(
                Math.ceil(
                  ADMIN_LOGIN_WINDOW_MS /
                    1000,
                ),
              ),
          },
        },
      );
    }

    const body =
      await req.json().catch(
        () => null,
      );

    const passcode =
      typeof body?.passcode ===
      'string'
        ? body.passcode.trim()
        : '';

    if (!passcode) {
      return NextResponse.json(
        {
          error:
            'SuperAdmin passcode is required.',
        },
        {
          status: 400,
        },
      );
    }

    const serverAdminKey =
      process.env.ADMIN_SECRET_KEY
        ?.trim();

    if (!serverAdminKey) {
      return NextResponse.json(
        {
          error:
            'Admin authentication is not configured.',
        },
        {
          status: 503,
        },
      );
    }

    const adminEmails = (
      process.env.ADMIN_EMAILS ||
      ''
    )
      .split(',')
      .map((email) =>
        email
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);

    if (
      adminEmails.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Admin authentication is not configured.',
        },
        {
          status: 503,
        },
      );
    }

    /*
     * Authenticate the Google account before evaluating the
     * SuperAdmin passcode. This avoids exposing a passcode
     * correctness oracle to unauthenticated callers.
     */
    const currentUser =
      await getAuthUser(req);

    if (!currentUser) {
      return NextResponse.json(
        {
          error:
            'Please sign in with your authorized Google account before entering the SuperAdmin passcode.',
          code:
            'GOOGLE_LOGIN_REQUIRED',
        },
        {
          status: 401,
        },
      );
    }

    const normalizedEmail =
      currentUser.email
        .trim()
        .toLowerCase();

    if (
      !adminEmails.includes(
        normalizedEmail,
      )
    ) {
      return NextResponse.json(
        {
          error:
            'This Google account is not authorized to access the SuperAdmin console.',
          code:
            'ADMIN_ACCOUNT_REQUIRED',
        },
        {
          status: 403,
        },
      );
    }

    const userRateLimit =
      await checkRateLimit(
        `admin-login-user:${currentUser.id}`,
        ADMIN_LOGIN_LIMIT,
        ADMIN_LOGIN_WINDOW_MS,
      );

    if (
      !userRateLimit.allowed
    ) {
      return NextResponse.json(
        {
          error:
            'Too many admin sign-in attempts. Please wait before trying again.',
        },
        {
          status: 429,
          headers: {
            'Retry-After':
              String(
                Math.ceil(
                  ADMIN_LOGIN_WINDOW_MS /
                    1000,
                ),
              ),
          },
        },
      );
    }

    if (
      !timingSafeStringEqual(
        passcode,
        serverAdminKey,
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid SuperAdmin passcode. Access denied.',
        },
        {
          status: 401,
        },
      );
    }

    const connection =
      await connectToDatabase();

    if (!connection) {
      return NextResponse.json(
        {
          error:
            'Admin account storage is unavailable.',
        },
        {
          status: 503,
        },
      );
    }

    const adminUser =
      await UserModel.findOne({
        email:
          normalizedEmail,
      });

    if (!adminUser) {
      return NextResponse.json(
        {
          error:
            'Authorized admin account was not found.',
        },
        {
          status: 404,
        },
      );
    }

    if (
      adminUser.isActive ===
      false
    ) {
      return NextResponse.json(
        {
          error:
            'This admin account has been disabled.',
        },
        {
          status: 403,
        },
      );
    }

    if (
      adminUser.role !==
      'ADMIN'
    ) {
      adminUser.role =
        'ADMIN';

      await adminUser.save();
    }

    const response =
      NextResponse.json({
        success: true,
        message:
          'SuperAdmin authenticated successfully.',
        user: {
          id:
            adminUser._id.toString(),
          name:
            adminUser.name,
          email:
            adminUser.email,
          role:
            adminUser.role,
        },
      });

    setSessionCookie(
      response,
      {
        id:
          adminUser._id.toString(),
        name:
          adminUser.name,
        email:
          adminUser.email,
        role:
          'ADMIN',
      },
    );

    return response;
  } catch (error: unknown) {
    console.error(
      'Admin login error:',
      error,
    );

    return NextResponse.json(
      {
        error:
          'Admin authentication failed.',
      },
      {
        status: 500,
      },
    );
  }
}
