import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  verifyOtpForPhone,
  normalizePhoneNumber,
} from '@/lib/auth/otp';

import {
  getAuthUser,
} from '@/lib/security/auth';

import {
  connectToDatabase,
} from '@/lib/db/mongodb';

import {
  UserModel,
} from '@/models/User';

/* ================================================================
   VERIFY PHONE OTP
================================================================ */

export async function POST(
  req: NextRequest,
) {
  try {
    /* ------------------------------------------------------------
       AUTHENTICATION
    ------------------------------------------------------------- */

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

    /* ------------------------------------------------------------
       INPUT
    ------------------------------------------------------------- */

    const body =
      await req.json().catch(() => null);

    const phone =
      typeof body?.phone ===
        'string'
        ? body.phone.trim()
        : '';

    const otp =
      typeof body?.otp ===
        'string'
        ? body.otp.trim()
        : '';

    if (!phone || !otp) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Phone number and OTP code are required.',
        },
        {
          status: 400,
        },
      );
    }

    /* ------------------------------------------------------------
       NORMALIZE
    ------------------------------------------------------------- */

    const normalizedPhone =
      normalizePhoneNumber(
        phone,
      );

    if (!normalizedPhone) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Please enter a valid Indian mobile number.',
        },
        {
          status: 400,
        },
      );
    }

    /* ------------------------------------------------------------
       VERIFY OTP
    ------------------------------------------------------------- */

    const result =
      await verifyOtpForPhone(
        normalizedPhone,
        otp,
      );

    if (!result.success) {
      return NextResponse.json(
        result,
        {
          status: 400,
        },
      );
    }

    /* ------------------------------------------------------------
       DATABASE
    ------------------------------------------------------------- */

    const connection =
      await connectToDatabase();

    if (!connection) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Database connection unavailable.',
        },
        {
          status: 503,
        },
      );
    }

    /* ------------------------------------------------------------
       UPDATE AUTHORITATIVE USER
    ------------------------------------------------------------- */

    const updatedUser =
      await UserModel.findByIdAndUpdate(
        authUser.id,

        {
          $set: {
            phone:
              normalizedPhone,

            isPhoneVerified:
              true,

            phoneVerifiedAt:
              new Date(),
          },
        },

        {
          new: true,

          runValidators: true,
        },
      ).lean();

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Your account could not be found.',
        },
        {
          status: 404,
        },
      );
    }

    /* ------------------------------------------------------------
       SUCCESS
    ------------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        message:
          'Mobile number verified successfully.',

        phone:
          normalizedPhone,

        isPhoneVerified: true,

        user: {
          id:
            updatedUser._id.toString(),

          name:
            updatedUser.name,

          email:
            updatedUser.email,

          phone:
            updatedUser.phone,

          isPhoneVerified:
            Boolean(
              updatedUser.isPhoneVerified,
            ),
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      'Verify OTP error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          'Failed to verify OTP. Please try again.',
      },
      {
        status: 500,
      },
    );
  }
}