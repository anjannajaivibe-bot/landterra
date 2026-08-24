import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { requireAuth } from '@/lib/security/auth';

import {
  CreateOrderSchema,
} from '@/lib/validation/payment';

import {
  createPublishingOrder,
} from '@/services/payment.service';

/* ================================================================
   CREATE RAZORPAY ORDER
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
      CreateOrderSchema.parse(body);

    const order =
      await createPublishingOrder(
        validated.propertyId,
        authUser.id,
        validated.purpose,
      );

    return NextResponse.json(
      {
        success: true,
        order,
      },
      {
        status: 201,
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
        : 'Failed to create payment order';

    let status = 500;
    if (message.includes('not found') || message.includes('Not found')) {
      status = 404;
    } else if (
      message.includes('Unauthorized') ||
      message.includes('own listings')
    ) {
      status = 403;
    } else if (
      message.includes('cannot be paid for') ||
      message.includes('Invalid')
    ) {
      status = 400;
    }

    return NextResponse.json(
      {
        error: message,
      },
      {
        status,
      },
    );
  }
}