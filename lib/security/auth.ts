import {
  NextRequest,
  NextResponse,
} from 'next/server';

import crypto from 'crypto';

import {
  UserSession,
  UserRole,
} from '@/types/user';

import { UserModel } from '@/models/User';

import { connectToDatabase } from '@/lib/db/mongodb';

/* ================================================================
   CONSTANTS
================================================================ */

export const SESSION_COOKIE =
  'landterra_session';

const SESSION_DURATION_SECONDS =
  60 * 60 * 24 * 30;

/* ================================================================
   SESSION PAYLOAD
================================================================ */

interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/* ================================================================
   BASE64URL
================================================================ */

function base64UrlEncode(
  value: string,
): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(
  value: string,
): string {
  return Buffer.from(
    value
      .replace(/-/g, '+')
      .replace(/_/g, '/'),
    'base64',
  ).toString('utf8');
}

/* ================================================================
   AUTH SECRET
================================================================ */

function getAuthSecret(): string {
  const secret =
    process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      'AUTH_SECRET is not configured.',
    );
  }

  if (secret.length < 32) {
    throw new Error(
      'AUTH_SECRET must contain at least 32 characters.',
    );
  }

  return secret;
}

/* ================================================================
   CREATE SESSION TOKEN
================================================================ */

export function createSessionToken(
  payload: {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
  },
): string {
  const now =
    Math.floor(
      Date.now() / 1000,
    );

  const sessionPayload: SessionPayload =
  {
    ...payload,

    iat: now,

    exp:
      now +
      SESSION_DURATION_SECONDS,
  };

  const encodedPayload =
    base64UrlEncode(
      JSON.stringify(
        sessionPayload,
      ),
    );

  const signature =
    crypto
      .createHmac(
        'sha256',
        getAuthSecret(),
      )
      .update(encodedPayload)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

  return `${encodedPayload}.${signature}`;
}

/* ================================================================
   VERIFY SESSION TOKEN
================================================================ */

export function verifySessionToken(
  token: string,
): SessionPayload | null {
  try {
    const parts =
      token.split('.');

    if (parts.length !== 2) {
      return null;
    }

    const [
      encodedPayload,
      providedSignature,
    ] = parts;

    const expectedSignature =
      crypto
        .createHmac(
          'sha256',
          getAuthSecret(),
        )
        .update(encodedPayload)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');

    const providedBuffer =
      Buffer.from(
        providedSignature,
      );

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
      );

    if (
      providedBuffer.length !==
      expectedBuffer.length
    ) {
      return null;
    }

    if (
      !crypto.timingSafeEqual(
        providedBuffer,
        expectedBuffer,
      )
    ) {
      return null;
    }

    const payload =
      JSON.parse(
        base64UrlDecode(
          encodedPayload,
        ),
      ) as SessionPayload;

    if (
      !payload.userId ||
      !payload.email ||
      !payload.exp
    ) {
      return null;
    }

    if (
      payload.exp <=
      Math.floor(
        Date.now() / 1000,
      )
    ) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error(
      'Session verification error:',
      error,
    );

    return null;
  }
}

/* ================================================================
   GET SESSION
================================================================ */

export async function getSession(
  req?: NextRequest,
): Promise<UserSession | null> {
  if (!req) {
    return null;
  }

  try {
    const token =
      req.cookies.get(
        SESSION_COOKIE,
      )?.value;

    if (!token) {
      return null;
    }

    /*
     * NEVER trust the browser's raw identity.
     *
     * First verify the cryptographic signature.
     */

    const payload =
      verifySessionToken(token);

    if (!payload) {
      return null;
    }

    const connection =
      await connectToDatabase();

    if (!connection) {
      return null;
    }

    /*
     * Retrieve the authoritative user from MongoDB.
     *
     * This means:
     *
     * - disabled user -> denied
     * - changed role -> immediately reflected
     * - phone verification -> immediately reflected
     */

    const dbUser =
      await UserModel.findById(
        payload.userId,
      ).lean();

    if (
      !dbUser ||
      dbUser.isActive === false
    ) {
      return null;
    }

    return {
      user: {
        id:
          dbUser._id.toString(),

        name:
          dbUser.name,

        email:
          dbUser.email,

        role:
          dbUser.role as UserRole,

        image:
          dbUser.profileImage,

        phone:
          dbUser.phone,

        isPhoneVerified:
          Boolean(
            dbUser.isPhoneVerified,
          ),

        sellerType:
          dbUser.sellerType,
      },
    };
  } catch (error) {
    console.error(
      'Session retrieval error:',
      error,
    );

    return null;
  }
}

/* ================================================================
   AUTHENTICATED USER
================================================================ */

export async function getAuthUser(
  req?: NextRequest,
): Promise<
  UserSession['user'] | null
> {
  const session =
    await getSession(req);

  return session?.user || null;
}

/* ================================================================
   REQUIRE AUTHENTICATION
================================================================ */

export async function requireAuth(
  req: NextRequest,
): Promise<
  UserSession['user'] | NextResponse
> {
  const user =
    await getAuthUser(req);

  if (!user) {
    return NextResponse.json(
      {
        error:
          'Unauthorized. Please sign in to continue.',
      },
      {
        status: 401,
      },
    );
  }

  return user;
}

/* ================================================================
   REQUIRE ROLE
================================================================ */

export async function requireRole(
  req: NextRequest,
  allowedRoles: UserRole[],
): Promise<
  UserSession['user'] | NextResponse
> {
  const authResult =
    await requireAuth(req);

  if (
    authResult instanceof
    NextResponse
  ) {
    return authResult;
  }

  if (
    !allowedRoles.includes(
      authResult.role,
    )
  ) {
    return NextResponse.json(
      {
        error:
          `Forbidden: Access restricted to ${allowedRoles.join(
            ', ',
          )}`,
      },
      {
        status: 403,
      },
    );
  }

  return authResult;
}

/* ================================================================
   REQUIRE PHONE VERIFICATION
================================================================ */

export async function requirePhoneVerification(
  req: NextRequest,
): Promise<
  UserSession['user'] | NextResponse
> {
  const user =
    await requireAuth(req);

  if (
    user instanceof NextResponse
  ) {
    return user;
  }

  if (
    !user.isPhoneVerified
  ) {
    return NextResponse.json(
      {
        error:
          'A verified mobile number is required to continue.',
        code:
          'PHONE_VERIFICATION_REQUIRED',
      },
      {
        status: 403,
      },
    );
  }

  return user;
}

/* ================================================================
   DOCUMENT ACCESS
================================================================ */

export function canAccessDocument(
  user: {
    id: string;
    role: UserRole;
  },

  propertySellerId: string,

  documentSellerId?: string,
): boolean {
  /*
   * Admin can access documents for verification.
   */

  if (
    user.role === 'ADMIN'
  ) {
    return true;
  }

  /*
   * Property owner can access their own documents.
   */

  if (
    user.id ===
    propertySellerId
  ) {
    return true;
  }

  /*
   * Additional document-level ownership check.
   */

  if (
    documentSellerId &&
    user.id ===
    documentSellerId
  ) {
    return true;
  }

  return false;
}

/* ================================================================
   SESSION COOKIE HELPER
================================================================ */

export function setSessionCookie(
  response: NextResponse,
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  },
) {
  const token =
    createSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

  response.cookies.set(
    SESSION_COOKIE,
    token,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        'production',

      sameSite: 'lax',

      maxAge:
        SESSION_DURATION_SECONDS,

      path: '/',
    },
  );

  return response;
}

/* ================================================================
   CLEAR SESSION
================================================================ */

export function clearSessionCookie(
  response: NextResponse,
) {
  response.cookies.set(
    SESSION_COOKIE,
    '',
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        'production',

      sameSite: 'lax',

      maxAge: 0,

      expires:
        new Date(0),

      path: '/',
    },
  );

  return response;
}