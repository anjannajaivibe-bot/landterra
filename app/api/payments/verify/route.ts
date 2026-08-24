import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  requireAuth,
} from '@/lib/security/auth';

import {
  VerifyPaymentSchema,
} from '@/lib/validation/payment';

import {
  verifyAndProcessPayment,
} from '@/services/payment.service';

/* ================================================================
   VERIFY RAZORPAY PAYMENT
================================================================ */

export async function POST(
  req: NextRequest,
) {
  const authUser =
    await requireAuth(req);

  if (
    authUser instanceof NextResponse
  ) {
    return authUser;
  }

  try {
    const body =
      await req.json();

    const validated =
      VerifyPaymentSchema.parse(body);

    const result =
      await verifyAndProcessPayment(
        validated,
        authUser,
      );

    return NextResponse.json(
      result,
      {
        status: 200,
      },
    );
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'issues' in err
    ) {
      return NextResponse.json(
        {
          error:
            'Validation failed',
          details: err,
        },
        {
          status: 400,
        },
      );
    }

    const message =
      err instanceof Error
        ? err.message
        : 'Payment verification failed';

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 400,
      },
    );
  }
}