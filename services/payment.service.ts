import {
  IPayment,
  CreateOrderResponse,
  VerifyPaymentRequest,
} from '@/types/payment';

import {
  PaymentModel,
} from '@/models/Payment';

import {
  ListingSubscriptionModel,
} from '@/models/ListingSubscription';

import {
  connectToDatabase,
} from '@/lib/db/mongodb';

import {
  getRazorpayClient,
  isRazorpayConfigured,
  verifyRazorpaySignature,
} from '@/lib/razorpay/client';

import {
  getPropertyById,
} from '@/services/property.service';

import {
  notifyListingSubmitted,
} from '@/services/email.service';

import {
  createAuditLog,
} from '@/services/audit.service';

import {
  PropertyModel,
} from '@/models/Property';

/* ================================================================
   CONSTANTS
================================================================ */

const LISTING_RATE_PER_YARD = 10;

const SUBSCRIPTION_DAYS = 30;

/* ================================================================
   HELPERS
================================================================ */

function calculateListingFee(
  landAreaYards: number,
): number {
  const area =
    Math.max(
      0,
      Math.round(
        Number(
          landAreaYards,
        ),
      ),
    );

  return (
    area *
    LISTING_RATE_PER_YARD
  );
}

/* ================================================================
   CREATE PUBLISHING ORDER
================================================================ */

export async function createPublishingOrder(
  propertyId: string,
  sellerId: string,
): Promise<CreateOrderResponse> {
  const property =
    await getPropertyById(
      propertyId,
    );

  if (!property) {
    throw new Error(
      'Property not found.',
    );
  }

  /*
   * AUTHORIZE AGAINST THE DATABASE.
   */
  if (
    property.sellerId !== sellerId
  ) {
    throw new Error(
      'Unauthorized. You can only pay for your own listings.',
    );
  }

  /*
   * Prevent payment for deleted/sold listings.
   */
  if (
    property.listingStatus ===
    'DELETED' ||
    property.listingStatus ===
    'SOLD'
  ) {
    throw new Error(
      'This property cannot be paid for.',
    );
  }

  /*
   * Do not create another order when an active order already
   * exists for this property.
   *
   * The frontend can safely retry.
   */
  const existingOrder =
    await PaymentModel.findOne({
      propertyId,
      sellerId,
      paymentPurpose:
        'LISTING_SUBSCRIPTION',
      paymentStatus: {
        $in: [
          'CREATED',
          'PENDING',
        ],
      },
    })
      .sort({
        createdAt: -1,
      })
      .lean();

  if (
    existingOrder
  ) {
    const keyId =
      process.env
        .NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env
        .RAZORPAY_KEY_ID ||
      '';

    return {
      orderId:
        existingOrder.razorpayOrderId,

      amount:
        existingOrder.amount *
        100,

      amountInRupees:
        existingOrder.amount,

      currency:
        existingOrder.currency,

      keyId,

      propertyId,

      landAreaYards:
        existingOrder.landAreaYards,
    };
  }

  if (
    !isRazorpayConfigured()
  ) {
    throw new Error(
      'Payment service is not configured. Razorpay credentials are required.',
    );
  }

  const razorpay =
    getRazorpayClient();

  if (!razorpay) {
    throw new Error(
      'Failed to initialize Razorpay payment gateway client.',
    );
  }

  /*
   * SINGLE AUTHORITATIVE FEE RULE
   *
   * ₹10 × actual property area.
   *
   * No arbitrary Math.max(50) here.
   */
  const landAreaYards =
    Math.max(
      0,
      Math.round(
        property.landAreaYards,
      ),
    );

  if (
    landAreaYards <= 0
  ) {
    throw new Error(
      'Property has an invalid land area.',
    );
  }

  const amountInRupees =
    calculateListingFee(
      landAreaYards,
    );

  const amountInPaise =
    amountInRupees * 100;

  if (
    amountInPaise <= 0
  ) {
    throw new Error(
      'Invalid payment amount.',
    );
  }

  const receiptNumber =
    `RCPT_${propertyId.substring(
      0,
      8,
    )}_${Date.now()}`;

  /*
   * Create Razorpay order.
   */
  const order =
    await razorpay.orders.create(
      {
        amount:
          amountInPaise,

        currency:
          'INR',

        receipt:
          receiptNumber,

        notes: {
          propertyId,
          sellerId,

          landAreaYards:
            landAreaYards.toString(),

          ratePerYard:
            LISTING_RATE_PER_YARD.toString(),

          title:
            property.title.substring(
              0,
              40,
            ),
        },
      },
    );

  const conn =
    await connectToDatabase();

  if (!conn) {
    throw new Error(
      'Database is not connected. Unable to save payment order.',
    );
  }

  /*
   * Save our own financial record.
   */
  await PaymentModel.create({
    sellerId,

    propertyId,

    propertyTitle:
      property.title,

    amount:
      amountInRupees,

    currency:
      'INR',

    landAreaYards,

    ratePerYard:
      LISTING_RATE_PER_YARD,

    razorpayOrderId:
      order.id,

    paymentStatus:
      'CREATED',

    paymentPurpose:
      'LISTING_SUBSCRIPTION',

    receiptNumber,
  });

  return {
    orderId:
      order.id,

    amount:
      amountInPaise,

    amountInRupees,

    currency:
      'INR',

    keyId:
      process.env
        .NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env
        .RAZORPAY_KEY_ID ||
      '',

    propertyId,

    landAreaYards,
  };
}

/* ================================================================
   VERIFY PAYMENT
================================================================ */

export async function verifyAndProcessPayment(
  data: VerifyPaymentRequest,
  sellerUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  },
): Promise<{
  success: boolean;
  message: string;
  payment?: IPayment;
}> {
  const conn =
    await connectToDatabase();

  if (!conn) {
    throw new Error(
      'Database connection required for payment verification.',
    );
  }

  /*
   * ------------------------------------------------------------
   * FIND PAYMENT RECORD
   * ------------------------------------------------------------
   */

  const paymentDoc =
    await PaymentModel.findOne({
      razorpayOrderId:
        data.razorpayOrderId,
    });

  if (!paymentDoc) {
    throw new Error(
      'Payment record not found for this order ID.',
    );
  }

  /*
   * ------------------------------------------------------------
   * AUTHORIZE PAYMENT
   * ------------------------------------------------------------
   */

  if (
    paymentDoc.sellerId !==
    sellerUser.id
  ) {
    throw new Error(
      'Unauthorized payment verification request.',
    );
  }

  if (
    paymentDoc.propertyId !==
    data.propertyId
  ) {
    throw new Error(
      'Payment order does not belong to this property.',
    );
  }

  /*
   * ------------------------------------------------------------
   * FIND PROPERTY
   * ------------------------------------------------------------
   */

  const property =
    await getPropertyById(
      paymentDoc.propertyId,
    );

  if (!property) {
    throw new Error(
      'Property associated with this payment was not found.',
    );
  }

  if (
    property.sellerId !==
    sellerUser.id
  ) {
    throw new Error(
      'You are not authorized to verify payment for this property.',
    );
  }

  /*
   * ------------------------------------------------------------
   * IDEMPOTENCY
   * ------------------------------------------------------------
   */

  if (
    paymentDoc.paymentStatus ===
    'PAID'
  ) {
    return {
      success: true,

      message:
        'Payment was already verified and processed.',

      payment:
        paymentDoc.toObject() as unknown as IPayment,
    };
  }

  /*
   * ------------------------------------------------------------
   * VERIFY HMAC
   * ------------------------------------------------------------
   */

  const isValidSignature =
    verifyRazorpaySignature(
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature,
    );

  if (!isValidSignature) {
    paymentDoc.paymentStatus =
      'FAILED';

    await paymentDoc.save();

    throw new Error(
      'Invalid Razorpay signature. Payment verification failed.',
    );
  }

  /*
   * ------------------------------------------------------------
   * VERIFY RAZORPAY PAYMENT SERVER-SIDE
   * ------------------------------------------------------------
   *
   * HMAC alone is not enough for our business workflow.
   */

  if (
    !isRazorpayConfigured()
  ) {
    throw new Error(
      'Payment service is not configured.',
    );
  }

  const razorpay =
    getRazorpayClient();

  if (!razorpay) {
    throw new Error(
      'Failed to initialize Razorpay client.',
    );
  }

  const razorpayPayment =
    await razorpay.payments.fetch(
      data.razorpayPaymentId,
    );

  /*
   * Verify payment belongs to our order.
   */
  if (
    razorpayPayment.order_id !==
    data.razorpayOrderId
  ) {
    throw new Error(
      'Razorpay payment does not belong to this order.',
    );
  }

  /*
   * Verify currency.
   */
  if (
    razorpayPayment.currency !==
    paymentDoc.currency
  ) {
    throw new Error(
      'Payment currency mismatch.',
    );
  }

  /*
   * Verify amount.
   */
  const expectedPaise =
    Math.round(
      paymentDoc.amount *
      100,
    );

  if (
    Number(
      razorpayPayment.amount,
    ) !==
    expectedPaise
  ) {
    throw new Error(
      'Payment amount mismatch.',
    );
  }

  /*
   * Razorpay should report captured/authorized payment.
   */
  if (
    razorpayPayment.status !==
    'captured' &&
    razorpayPayment.status !==
    'authorized'
  ) {
    throw new Error(
      `Payment is not in a successful state. Current status: ${razorpayPayment.status}`,
    );
  }

  /*
   * ------------------------------------------------------------
   * PAYMENT SUCCESS
   * ------------------------------------------------------------
   */

  const now =
    new Date();

  const periodEnd =
    new Date(
      now.getTime() +
      SUBSCRIPTION_DAYS *
      24 *
      60 *
      60 *
      1000,
    );

  paymentDoc.paymentStatus =
    'PAID';

  paymentDoc.razorpayPaymentId =
    data.razorpayPaymentId;

  paymentDoc.razorpaySignature =
    data.razorpaySignature;

  paymentDoc.paidAt =
    now;

  await paymentDoc.save();

  /*
   * ------------------------------------------------------------
   * CREATE SUBSCRIPTION
   * ------------------------------------------------------------
   *
   * Use the existing model.
   */

  let subscription;

  try {
    subscription =
      await ListingSubscriptionModel.findOneAndUpdate(
        {
          razorpayOrderId:
            data.razorpayOrderId,
        },
        {
          $setOnInsert: {
            propertyId:
              paymentDoc.propertyId,

            propertyTitle:
              property.title,

            sellerId:
              sellerUser.id,

            amount:
              paymentDoc.amount,

            ratePerSquareYard:
              LISTING_RATE_PER_YARD,

            landAreaYards:
              property.landAreaYards,

            periodStart:
              now,

            periodEnd,

            status:
              'ACTIVE',

            razorpayOrderId:
              data.razorpayOrderId,

            razorpayPaymentId:
              data.razorpayPaymentId,
          },
        },
        {
          new: true,
          upsert: true,
        },
      );
  } catch (error) {
    console.error(
      'Subscription creation error:',
      error,
    );

    throw new Error(
      'Payment succeeded but subscription creation failed. Please contact support.',
    );
  }

  /*
   * ------------------------------------------------------------
   * PROPERTY LIFECYCLE
   * ------------------------------------------------------------
   *
   * DO NOT use updateProperty() for lifecycle state.
   */

  const nextListingStatus =
    property.verificationStatus ===
      'VERIFIED'
      ? 'PUBLISHED'
      : 'PENDING_VERIFICATION';

  await PropertyModel.findByIdAndUpdate(
    property._id,
    {
      $set: {
        listingStatus:
          nextListingStatus,

        subscriptionStartedAt:
          now,

        subscriptionExpiresAt:
          subscription.periodEnd,

        updatedAt:
          now,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  /*
   * ------------------------------------------------------------
   * NOTIFICATION
   * ------------------------------------------------------------
   */

  try {
    await notifyListingSubmitted(
      property.sellerEmail ||
      sellerUser.email,

      property.sellerName ||
      sellerUser.name,

      property.title,

      paymentDoc.amount,
    );
  } catch (emailError) {
    /*
     * Payment should not be rolled back because email failed.
     */
    console.error(
      'Listing payment email notification failed:',
      emailError,
    );
  }

  /*
   * ------------------------------------------------------------
   * AUDIT
   * ------------------------------------------------------------
   */

  await createAuditLog({
    actorId:
      sellerUser.id,

    actorName:
      sellerUser.name,

    actorEmail:
      sellerUser.email,

    actorRole:
      sellerUser.role,

    action:
      'PAYMENT_SUCCESS_LISTING_SUBMITTED',

    entityType:
      'PAYMENT',

    entityId:
      paymentDoc._id.toString(),

    metadata: {
      propertyId:
        paymentDoc.propertyId,

      amount:
        paymentDoc.amount,

      razorpayOrderId:
        data.razorpayOrderId,

      razorpayPaymentId:
        data.razorpayPaymentId,

      subscriptionId:
        subscription._id.toString(),
    },
  });

  return {
    success: true,

    message:
      'Payment verified successfully. Listing submitted for admin verification.',

    payment:
      paymentDoc.toObject() as unknown as IPayment,
  };
}

/* ================================================================
   RAZORPAY WEBHOOK PROCESSING
================================================================ */

export async function processRazorpayWebhook(
  payload: any,
): Promise<void> {
  const event =
    payload?.event;

  /*
   * We only process events that matter to our marketplace.
   */

  if (
    event !==
    'payment.captured' &&
    event !==
    'order.paid'
  ) {
    return;
  }

  const paymentEntity =
    payload?.payload?.payment?.entity;

  if (!paymentEntity) {
    console.warn(
      'Razorpay webhook missing payment entity.',
    );

    return;
  }

  const razorpayOrderId =
    paymentEntity.order_id;

  const razorpayPaymentId =
    paymentEntity.id;

  if (
    !razorpayOrderId ||
    !razorpayPaymentId
  ) {
    throw new Error(
      'Webhook payment entity is missing order/payment IDs.',
    );
  }

  const conn =
    await connectToDatabase();

  if (!conn) {
    throw new Error(
      'Database connection unavailable.',
    );
  }

  const paymentDoc =
    await PaymentModel.findOne({
      razorpayOrderId,
    });

  /*
   * The order may not belong to LandTerra.
   * Ignore rather than failing the webhook.
   */
  if (!paymentDoc) {
    console.warn(
      'Razorpay webhook order not found in LandTerra:',
      razorpayOrderId,
    );

    return;
  }

  /*
   * Idempotency.
   */
  if (
    paymentDoc.paymentStatus ===
    'PAID' &&
    paymentDoc.razorpayPaymentId ===
    razorpayPaymentId
  ) {
    return;
  }

  /*
   * Verify amount from webhook against our original order.
   */
  const expectedPaise =
    Math.round(
      paymentDoc.amount *
      100,
    );

  if (
    Number(
      paymentEntity.amount,
    ) !==
    expectedPaise
  ) {
    throw new Error(
      'Webhook payment amount does not match LandTerra order.',
    );
  }

  paymentDoc.paymentStatus =
    'PAID';

  paymentDoc.razorpayPaymentId =
    razorpayPaymentId;

  paymentDoc.paidAt =
    paymentDoc.paidAt ||
    new Date();

  await paymentDoc.save();

  /*
   * Create/update subscription.
   */
  const property =
    await getPropertyById(
      paymentDoc.propertyId,
    );

  if (!property) {
    console.warn(
      'Webhook property not found:',
      paymentDoc.propertyId,
    );

    return;
  }

  const now =
    new Date();

  const periodEnd =
    new Date(
      now.getTime() +
      SUBSCRIPTION_DAYS *
      24 *
      60 *
      60 *
      1000,
    );

  const subscription =
    await ListingSubscriptionModel.findOneAndUpdate(
      {
        razorpayOrderId,
      },
      {
        $setOnInsert: {
          propertyId:
            paymentDoc.propertyId,

          propertyTitle:
            property.title,

          sellerId:
            paymentDoc.sellerId,

          amount:
            paymentDoc.amount,

          ratePerSquareYard:
            LISTING_RATE_PER_YARD,

          landAreaYards:
            property.landAreaYards,

          periodStart:
            now,

          periodEnd,

          status:
            'ACTIVE',

          razorpayOrderId,

          razorpayPaymentId,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

  /*
   * Update property lifecycle.
   */
  const nextListingStatus =
    property.verificationStatus ===
      'VERIFIED'
      ? 'PUBLISHED'
      : 'PENDING_VERIFICATION';

  await PropertyModel.findByIdAndUpdate(
    property._id,
    {
      $set: {
        listingStatus:
          nextListingStatus,

        subscriptionStartedAt:
          property.subscriptionStartedAt ||
          now,

        subscriptionExpiresAt:
          subscription.periodEnd,

        updatedAt:
          new Date(),
      },
    },
  );

  await createAuditLog({
    actorId:
      'RAZORPAY_WEBHOOK',

    actorName:
      'Razorpay System',

    actorEmail:
      'webhook@razorpay.com',

    actorRole:
      'SYSTEM',

    action:
      'WEBHOOK_PAYMENT_CAPTURED',

    entityType:
      'PAYMENT',

    entityId:
      paymentDoc._id.toString(),

    metadata: {
      propertyId:
        paymentDoc.propertyId,

      orderId:
        razorpayOrderId,

      paymentId:
        razorpayPaymentId,

      amount:
        paymentDoc.amount,

      status:
        paymentEntity.status,
    },
  });
}

/* ================================================================
   SELLER PAYMENTS
================================================================ */

export async function getPaymentsForSeller(
  sellerId: string,
): Promise<IPayment[]> {
  try {
    const conn =
      await connectToDatabase();

    if (!conn) {
      return [];
    }

    const docs =
      await PaymentModel.find({
        sellerId,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return docs as unknown as IPayment[];
  } catch (error) {
    console.error(
      'Error fetching seller payments:',
      error,
    );

    return [];
  }
}

/* ================================================================
   ADMIN PAYMENTS
================================================================ */

export async function getAllPayments(
  limit = 50,
): Promise<IPayment[]> {
  try {
    const conn =
      await connectToDatabase();

    if (!conn) {
      return [];
    }

    const safeLimit =
      Math.min(
        100,
        Math.max(
          1,
          Number(limit) || 50,
        ),
      );

    const docs =
      await PaymentModel.find({})
        .sort({
          createdAt: -1,
        })
        .limit(safeLimit)
        .lean();

    return docs as unknown as IPayment[];
  } catch (error) {
    console.error(
      'Error fetching all payments:',
      error,
    );

    return [];
  }
}