import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  sendOtpToPhone,
} from '@/lib/auth/otp';

import {
  getAuthUser,
} from '@/lib/security/auth';

/* ================================================================
   SEND PHONE OTP
================================================================ */

export async function POST(
  req: NextRequest,
) {
  try {
    /*
     * Phone verification belongs to an authenticated
     * LandTerra customer account.
     */

    const authUser =
      await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Please sign in with Google before verifying your mobile number.',

          code:
            'AUTHENTICATION_REQUIRED',
        },
        {
          status: 401,
        },
      );
    }

    const body =
      await req.json();

    const phone =
      typeof body?.phone ===
        'string'
        ? body.phone.trim()
        : '';

    if (!phone) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Phone number is required.',
        },
        {
          status: 400,
        },
      );
    }

    /*
     * OTP delivery implementation remains inside
     * lib/auth/otp.ts.
     */

    const result =
      await sendOtpToPhone(
        phone,
      );

    return NextResponse.json(
      result,
      {
        status:
          result.success
            ? 200
            : 400,
      },
    );
  } catch (error) {
    console.error(
      'Send OTP error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          'Failed to send OTP. Please try again.',
      },
      {
        status: 500,
      },
    );
  }
}