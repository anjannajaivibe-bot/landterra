import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  verifyWebhookSignature,
} from '@/lib/razorpay/client';

import {
  processRazorpayWebhook,
} from '@/services/payment.service';

/* ================================================================
   RAZORPAY WEBHOOK
================================================================ */

export async function POST(
  req: NextRequest,
) {
  try {
    const signature =
      req.headers.get(
        'x-razorpay-signature',
      );

    const webhookSecret =
      process.env
        .RAZORPAY_WEBHOOK_SECRET;

    /*
     * Never accept an unsigned webhook.
     */
    if (
      !signature ||
      !webhookSecret
    ) {
      console.error(
        'Razorpay webhook rejected: missing signature or secret.',
      );

      return NextResponse.json(
        {
          error:
            'Webhook authentication failed.',
        },
        {
          status: 401,
        },
      );
    }

    /*
     * IMPORTANT:
     * Signature verification must use the raw body.
     */
    const rawBody =
      await req.text();

    const isValid =
      verifyWebhookSignature(
        rawBody,
        signature,
        webhookSecret,
      );

    if (!isValid) {
      console.error(
        'Invalid Razorpay webhook signature.',
      );

      return NextResponse.json(
        {
          error:
            'Invalid webhook signature.',
        },
        {
          status: 400,
        },
      );
    }

    let payload: any;

    try {
      payload =
        JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid webhook JSON.',
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Let the payment service own all payment business logic.
     */
    await processRazorpayWebhook(
      payload,
    );

    return NextResponse.json(
      {
        status: 'ok',
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    console.error(
      'Razorpay webhook error:',
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Webhook handling failed';

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}