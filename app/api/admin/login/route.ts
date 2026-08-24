import { NextRequest, NextResponse } from 'next/server';

import { UserModel } from '@/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';
import { setSessionCookie } from '@/lib/security/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const passcode =
      typeof body?.passcode === 'string'
        ? body.passcode
        : '';

    if (!passcode) {
      return NextResponse.json(
        {
          error: 'SuperAdmin passcode is required.',
        },
        { status: 400 },
      );
    }

    const serverAdminKey =
      process.env.ADMIN_SECRET_KEY;

    if (!serverAdminKey) {
      return NextResponse.json(
        {
          error:
            'ADMIN_SECRET_KEY is not configured in .env.local.',
        },
        { status: 500 },
      );
    }

    /*
     * Verify SuperAdmin passcode.
     */
    if (
      passcode.trim() !==
      serverAdminKey.trim()
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid SuperAdmin passcode. Access denied.',
        },
        { status: 401 },
      );
    }

    /*
     * Admin identity should come from a configured
     * admin email, NOT from arbitrary browser input.
     */
    const adminEmails = (
      process.env.ADMIN_EMAILS || ''
    )
      .split(',')
      .map((email) =>
        email.trim().toLowerCase(),
      )
      .filter(Boolean);

    if (adminEmails.length === 0) {
      return NextResponse.json(
        {
          error:
            'ADMIN_EMAILS is not configured.',
        },
        { status: 500 },
      );
    }

    /*
     * Get the currently authenticated Google user.
     *
     * IMPORTANT:
     * We cannot trust email/name sent from the browser.
     */
    const { getAuthUser } = await import(
      '@/lib/security/auth'
    );

    const currentUser =
      await getAuthUser(req);

    if (!currentUser) {
      return NextResponse.json(
        {
          error:
            'Please sign in with your authorized Google account before entering the SuperAdmin passcode.',
          code: 'GOOGLE_LOGIN_REQUIRED',
        },
        { status: 401 },
      );
    }

    const normalizedEmail =
      currentUser.email
        .trim()
        .toLowerCase();

    /*
     * Require BOTH:
     *
     * 1. Authorized Google account
     * 2. SuperAdmin passcode
     */
    if (
      !adminEmails.includes(
        normalizedEmail,
      )
    ) {
      return NextResponse.json(
        {
          error:
            'This Google account is not authorized to access the SuperAdmin console.',
          code: 'ADMIN_ACCOUNT_REQUIRED',
        },
        { status: 403 },
      );
    }

    const connection =
      await connectToDatabase();

    if (!connection) {
      return NextResponse.json(
        {
          error:
            'Database is not connected. Please check MONGODB_URI.',
        },
        { status: 503 },
      );
    }

    /*
     * Find the EXISTING Google account.
     *
     * Never create a fake "admin_xxx" Google ID here.
     */
    const adminUser =
      await UserModel.findOne({
        email: normalizedEmail,
      });

    if (!adminUser) {
      return NextResponse.json(
        {
          error:
            'Authorized admin account was not found in MongoDB.',
        },
        { status: 404 },
      );
    }

    if (adminUser.isActive === false) {
      return NextResponse.json(
        {
          error:
            'This admin account has been disabled.',
        },
        { status: 403 },
      );
    }

    /*
     * Ensure the authorized account has ADMIN role.
     */
    if (adminUser.role !== 'ADMIN') {
      adminUser.role = 'ADMIN';
      await adminUser.save();
    }

    /*
     * IMPORTANT:
     *
     * Use the SAME signed session mechanism as Google OAuth.
     *
     * Do NOT manually create a raw cookie.
     */
    const response =
      NextResponse.json({
        success: true,
        message:
          'SuperAdmin authenticated successfully.',
        user: {
          id: adminUser._id.toString(),
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        },
      });

    setSessionCookie(
      response,
      {
        id: adminUser._id.toString(),
        name: adminUser.name,
        email: adminUser.email,
        role: 'ADMIN',
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
          error instanceof Error
            ? error.message
            : 'Admin authentication failed.',
      },
      { status: 500 },
    );
  }
}