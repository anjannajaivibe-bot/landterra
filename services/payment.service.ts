import {
  IPayment,
  CreateOrderResponse,
  VerifyPaymentRequest,
  PaymentPurpose,
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

import {
  getPlatformSettings,
} from '@/services/settings.service';

/* ================================================================
   CONSTANTS
================================================================ */

const DEFAULT_LISTING_FEE = 10;
const DEFAULT_DURATION_DAYS = 30;

/* ================================================================
   CREATE PUBLISHING / RENEWAL ORDER (AUTHORITATIVE SERVER FEE)
================================================================ */

export async function createPublishingOrder(
  propertyId: string,
  sellerId: string,
  purpose: PaymentPurpose = 'LISTING_SUBSCRIPTION',
): Promise<CreateOrderResponse> {
  const property = await getPropertyById(propertyId);

  if (!property) {
    throw new Error('Property not found.');
  }

  /*
   * AUTHORIZE AGAINST THE DATABASE.
   */
  if (property.sellerId !== sellerId) {
    throw new Error(
      'Unauthorized. You can only pay for your own listings.',
    );
  }

  /*
   * Prevent payment for deleted/sold listings.
   */
  if (
    property.listingStatus === 'DELETED' ||
    property.listingStatus === 'SOLD'
  ) {
    throw new Error('This property cannot be paid for.');
  }

  /*
   * AUTHORITATIVE PLATFORM SETTING SNAPSHOT
   *
   * The server strictly decides the fee amount and validity days.
   * Client-provided fees or durations are never trusted.
   */
  const settings = await getPlatformSettings();

  const amountInRupees =
    typeof settings.listingFeeAmount === 'number' && settings.listingFeeAmount > 0
      ? settings.listingFeeAmount
      : DEFAULT_LISTING_FEE;

  const durationDays =
    typeof settings.listingFeeDurationDays === 'number' && settings.listingFeeDurationDays > 0
      ? settings.listingFeeDurationDays
      : DEFAULT_DURATION_DAYS;

  /*
   * Check for an existing CREATED/PENDING order for this property and purpose.
   * If found and matching the current authoritative price, reuse it.
   */
  const existingOrder = await PaymentModel.findOne({
    propertyId,
    sellerId,
    paymentPurpose: purpose,
    paymentStatus: {
      $in: ['CREATED', 'PENDING'],
    },
    amount: amountInRupees, // Only reuse if the price snapshot matches
  })
    .sort({ createdAt: -1 })
    .lean();

  if (existingOrder) {
    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      '';

    return {
      orderId: existingOrder.razorpayOrderId,
      amount: existingOrder.amount * 100,
      amountInRupees: existingOrder.amount,
      currency: existingOrder.currency,
      keyId,
      propertyId,
      landAreaYards: existingOrder.landAreaYards,
      durationDays: existingOrder.listingFeeDurationDays || durationDays,
    };
  }

  if (!isRazorpayConfigured()) {
    throw new Error(
      'Payment service is not configured. Razorpay credentials are required.',
    );
  }

  const razorpay = getRazorpayClient();

  if (!razorpay) {
    throw new Error(
      'Failed to initialize Razorpay payment gateway client.',
    );
  }

  const landAreaYards = Math.max(
    0,
    Math.round(property.landAreaYards),
  );

  const amountInPaise = amountInRupees * 100;

  if (amountInPaise <= 0) {
    throw new Error('Invalid payment amount.');
  }

  const receiptNumber = `RCPT_${propertyId.substring(0, 8)}_${Date.now()}`;

  /*
   * Create Razorpay order.
   */
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: receiptNumber,
    notes: {
      propertyId,
      sellerId,
      purpose,
      landAreaYards: landAreaYards.toString(),
      listingFee: amountInRupees.toString(),
      durationDays: durationDays.toString(),
      title: property.title.substring(0, 40),
    },
  });

  const conn = await connectToDatabase();

  if (!conn) {
    throw new Error(
      'Database is not connected. Unable to save payment order.',
    );
  }

  /*
   * Save our own authoritative financial snapshot.
   */
  await PaymentModel.create({
    sellerId,
    propertyId,
    propertyTitle: property.title,
    amount: amountInRupees,
    currency: 'INR',
    listingFeeDurationDays: durationDays,
    landAreaYards,
    razorpayOrderId: order.id,
    paymentStatus: 'CREATED',
    paymentPurpose: purpose,
    receiptNumber,
  });

  /*
   * Keep property payment state as PENDING (never destroy property data).
   */
  await PropertyModel.findByIdAndUpdate(property._id, {
    $set: {
      paymentStatus: 'PENDING',
      updatedAt: new Date(),
    },
  });

  return {
    orderId: order.id,
    amount: amountInPaise,
    amountInRupees,
    currency: 'INR',
    keyId:
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      '',
    propertyId,
    landAreaYards,
    durationDays,
  };
}

/* ================================================================
   RECORD PAYMENT FAILURE (PRESERVE PROPERTY DRAFT)
================================================================ */

export async function recordPaymentFailure(
  propertyId: string,
  sellerId: string,
  razorpayOrderId?: string,
  reason?: string,
): Promise<void> {
  try {
    const conn = await connectToDatabase();
    if (!conn) return;

    if (razorpayOrderId) {
      await PaymentModel.findOneAndUpdate(
        { razorpayOrderId, sellerId },
        {
          $set: {
            paymentStatus: 'FAILED',
            metadata: { failureReason: reason || 'Checkout dismissed or payment failed' },
            updatedAt: new Date(),
          },
        }
      );
    }

    // Mark property paymentStatus as FAILED while keeping listingStatus as PAYMENT_PENDING/DRAFT
    const property = await PropertyModel.findOne({ _id: propertyId, sellerId });
    if (
      property &&
      property.listingStatus !== 'PUBLISHED' &&
      property.listingStatus !== 'PENDING_VERIFICATION'
    ) {
      await PropertyModel.findByIdAndUpdate(propertyId, {
        $set: {
          paymentStatus: 'FAILED',
          listingStatus: 'PAYMENT_PENDING',
          updatedAt: new Date(),
        },
      });
    }

    await createAuditLog({
      actorId: sellerId,
      actorName: 'Seller',
      actorEmail: '',
      actorRole: 'SELLER',
      action: 'PAYMENT_FAILED',
      entityType: 'PAYMENT',
      entityId: razorpayOrderId || propertyId,
      metadata: {
        propertyId,
        reason: reason || 'Payment cancelled or failed',
      },
    });
  } catch (err) {
    console.error('Error recording payment failure:', err);
  }
}

/* ================================================================
   CORE PAYMENT SETTLEMENT PIPELINE (SHARED BY CLIENT & WEBHOOK)
================================================================ */

interface SettlePaymentOptions {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

async function executePaymentSettlementPipeline({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  actor,
}: SettlePaymentOptions): Promise<{
  paymentDoc: any;
  subscriptionDoc: any;
  propertyDoc: any;
}> {
  const conn = await connectToDatabase();
  if (!conn) {
    throw new Error('Database connection unavailable.');
  }

  /*
   * 1. Retrieve the authoritative LandTerra payment snapshot.
   */
  const paymentDoc = await PaymentModel.findOne({ razorpayOrderId });
  if (!paymentDoc) {
    throw new Error(`Payment record for order ${razorpayOrderId} not found.`);
  }

  /*
   * 2. If not already PAID, mark as PAID and set timestamps.
   */
  if (paymentDoc.paymentStatus !== 'PAID') {
    paymentDoc.paymentStatus = 'PAID';
    paymentDoc.razorpayPaymentId = razorpayPaymentId;
    if (razorpaySignature) {
      paymentDoc.razorpaySignature = razorpaySignature;
    }
    paymentDoc.paidAt = paymentDoc.paidAt || new Date();
    await paymentDoc.save();
  }

  /*
   * 3. Fetch associated property.
   */
  const property = await getPropertyById(paymentDoc.propertyId);
  if (!property) {
    throw new Error(`Associated property ${paymentDoc.propertyId} not found.`);
  }

  /*
   * 4. RENEWAL & EXPIRY DATE LOGIC (Requirement 11)
   *
   * If renewing an active unexpired subscription, append onto existing periodEnd.
   * If renewing an expired subscription or fresh listing, start from payment time.
   */
  const now = paymentDoc.paidAt ? new Date(paymentDoc.paidAt) : new Date();
  const durationDays = paymentDoc.listingFeeDurationDays || DEFAULT_DURATION_DAYS;

  const latestActiveSub = await ListingSubscriptionModel.findOne({
    propertyId: paymentDoc.propertyId,
    status: 'ACTIVE',
    periodEnd: { $gt: now },
    razorpayOrderId: { $ne: razorpayOrderId },
  }).sort({ periodEnd: -1 });

  let newPeriodStart: Date;
  if (latestActiveSub && latestActiveSub.periodEnd) {
    newPeriodStart = new Date(latestActiveSub.periodEnd);
  } else {
    newPeriodStart = now;
  }

  const newPeriodEnd = new Date(
    newPeriodStart.getTime() + durationDays * 24 * 60 * 60 * 1000,
  );

  /*
   * 5. ATOMIC IDEMPOTENT SUBSCRIPTION CREATION (Requirement 13)
   */
  const subscription = await ListingSubscriptionModel.findOneAndUpdate(
    { razorpayOrderId },
    {
      $setOnInsert: {
        propertyId: paymentDoc.propertyId,
        propertyTitle: property.title,
        sellerId: paymentDoc.sellerId,
        amount: paymentDoc.amount,
        listingFeeDurationDays: durationDays,
        landAreaYards: property.landAreaYards,
        periodStart: newPeriodStart,
        periodEnd: newPeriodEnd,
        status: 'ACTIVE',
        razorpayOrderId,
        razorpayPaymentId,
      },
    },
    { new: true, upsert: true, returnDocument: 'after' },
  );

  if (subscription && !paymentDoc.subscriptionId) {
    paymentDoc.subscriptionId = subscription._id.toString();
    await paymentDoc.save();
  }

  /*
   * 6. PROPERTY LIFECYCLE TRANSITION (Requirement 17)
   *
   * If property is already VERIFIED (e.g. renewal of active listing): PUBLISHED.
   * If property is NOT VERIFIED (e.g. new draft): PENDING_VERIFICATION.
   */
  let nextListingStatus = property.listingStatus;
  if (property.verificationStatus === 'VERIFIED') {
    nextListingStatus = 'PUBLISHED';
  } else {
    nextListingStatus = 'PENDING_VERIFICATION';
  }

  const updatedProperty = await PropertyModel.findByIdAndUpdate(
    property._id,
    {
      $set: {
        paymentStatus: 'PAID',
        listingStatus: nextListingStatus,
        subscriptionStartedAt: property.subscriptionStartedAt || newPeriodStart,
        subscriptionExpiresAt: subscription ? subscription.periodEnd : newPeriodEnd,
        updatedAt: new Date(),
      },
    },
    { new: true }
  );

  /*
   * 7. ATOMIC EMAIL DISPATCH (Requirement 15)
   */
  const emailClaim = await PaymentModel.findOneAndUpdate(
    { _id: paymentDoc._id, confirmationEmailSentAt: { $exists: false } },
    { $set: { confirmationEmailSentAt: new Date() } }
  );

  if (emailClaim) {
    try {
      const emailRecipient = actor.email || property.sellerEmail;
      const recipientName = actor.name || property.sellerName || 'LandTerra Seller';
      if (emailRecipient) {
        await notifyListingSubmitted(
          emailRecipient,
          recipientName,
          property.title,
          paymentDoc.amount,
        );
      }
    } catch (emailError) {
      console.error('Failed to dispatch payment confirmation email:', emailError);
    }
  }

  /*
   * 8. ATOMIC AUDIT LOGGING WITH DETERMINISTIC EVENT KEY (Requirement 14)
   */
  const isRenewal = paymentDoc.paymentPurpose === 'SUBSCRIPTION_RENEWAL';
  const eventKey = `PAYMENT_AUDIT:${razorpayOrderId}`;

  await createAuditLog({
    eventKey,
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: isRenewal ? 'SUBSCRIPTION_RENEWED' : 'PAYMENT_SUCCESS_LISTING_SUBMITTED',
    entityType: 'PAYMENT',
    entityId: paymentDoc._id.toString(),
    metadata: {
      propertyId: paymentDoc.propertyId,
      amount: paymentDoc.amount,
      durationDays,
      isRenewal,
      periodStart: newPeriodStart,
      periodEnd: newPeriodEnd,
      razorpayOrderId,
      razorpayPaymentId,
      subscriptionId: subscription ? subscription._id.toString() : undefined,
    },
  });

  return {
    paymentDoc,
    subscriptionDoc: subscription,
    propertyDoc: updatedProperty,
  };
}

/* ================================================================
   VERIFY AND PROCESS PAYMENT (BROWSER ENTRYPOINT)
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
  payment: IPayment;
}> {
  if (
    !data.propertyId ||
    !data.razorpayOrderId ||
    !data.razorpayPaymentId ||
    !data.razorpaySignature
  ) {
    throw new Error('Missing payment verification details.');
  }

  const conn = await connectToDatabase();
  if (!conn) {
    throw new Error('Database connection unavailable. Please try again.');
  }

  /*
   * 1. Retrieve the payment record from MongoDB.
   */
  const paymentDoc = await PaymentModel.findOne({
    razorpayOrderId: data.razorpayOrderId,
  });

  if (!paymentDoc) {
    throw new Error('Payment record not found.');
  }

  /*
   * 2. Authorize relationship.
   */
  if (paymentDoc.propertyId !== data.propertyId) {
    throw new Error('Payment record does not match the property.');
  }

  if (paymentDoc.sellerId !== sellerUser.id) {
    throw new Error(
      'You are not authorized to verify payment for this property.',
    );
  }

  /*
   * 3. Validate signature & captured status if not already PAID.
   */
  if (paymentDoc.paymentStatus !== 'PAID') {
    const isValidSignature = verifyRazorpaySignature(
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature,
    );

    if (!isValidSignature) {
      paymentDoc.paymentStatus = 'FAILED';
      await paymentDoc.save();
      throw new Error(
        'Invalid Razorpay signature. Payment verification failed.',
      );
    }

    if (!isRazorpayConfigured()) {
      throw new Error('Payment service is not configured.');
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      throw new Error('Failed to initialize Razorpay client.');
    }

    const razorpayPayment = await razorpay.payments.fetch(
      data.razorpayPaymentId,
    );

    if (razorpayPayment.order_id !== data.razorpayOrderId) {
      throw new Error('Razorpay payment does not belong to this order.');
    }

    if (razorpayPayment.currency !== paymentDoc.currency) {
      throw new Error('Payment currency mismatch.');
    }

    const expectedPaise = Math.round(paymentDoc.amount * 100);
    if (Number(razorpayPayment.amount) !== expectedPaise) {
      throw new Error('Payment amount mismatch.');
    }

    if (razorpayPayment.status !== 'captured') {
      throw new Error(
        `Payment is not captured. Current status: ${razorpayPayment.status}`,
      );
    }
  }

  /*
   * 4. Execute the unified settlement pipeline.
   */
  const { paymentDoc: settledPayment, propertyDoc } =
    await executePaymentSettlementPipeline({
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      actor: sellerUser,
    });

  return {
    success: true,
    message:
      propertyDoc?.verificationStatus === 'VERIFIED'
        ? 'Payment verified successfully. Listing subscription renewed and published.'
        : 'Payment verified successfully. Listing submitted for admin verification.',
    payment: settledPayment.toObject() as unknown as IPayment,
  };
}

/* ================================================================
   RAZORPAY WEBHOOK PROCESSING (UNIFIED WITH SETTLEMENT PIPELINE)
================================================================ */

export async function processRazorpayWebhook(payload: any): Promise<void> {
  const event = payload?.event;

  if (event !== 'payment.captured' && event !== 'order.paid') {
    return;
  }

  const paymentEntity = payload?.payload?.payment?.entity;
  const orderEntity = payload?.payload?.order?.entity;

  const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
  const razorpayPaymentId = paymentEntity?.id;

  if (!razorpayOrderId) {
    console.warn('Razorpay webhook missing order ID.');
    return;
  }

  const conn = await connectToDatabase();
  if (!conn) {
    throw new Error('Database connection unavailable.');
  }

  const paymentDoc = await PaymentModel.findOne({ razorpayOrderId });
  if (!paymentDoc) {
    console.warn('Razorpay webhook order not found in LandTerra:', razorpayOrderId);
    return;
  }

  if (paymentEntity?.amount) {
    const expectedPaise = Math.round(paymentDoc.amount * 100);
    if (Number(paymentEntity.amount) !== expectedPaise) {
      throw new Error('Webhook payment amount does not match LandTerra order.');
    }
  }

  await executePaymentSettlementPipeline({
    razorpayOrderId,
    razorpayPaymentId: razorpayPaymentId || paymentDoc.razorpayPaymentId || 'WEBHOOK_CAPTURED',
    actor: {
      id: 'RAZORPAY_WEBHOOK',
      name: 'Razorpay Gateway Webhook',
      email: 'webhook@razorpay.com',
      role: 'SYSTEM',
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
    const conn = await connectToDatabase();
    if (!conn) return [];

    const docs = await PaymentModel.find({ sellerId })
      .sort({ createdAt: -1 })
      .lean();

    return docs as unknown as IPayment[];
  } catch (error) {
    console.error('Error fetching seller payments:', error);
    return [];
  }
}

/* ================================================================
   ADMIN PAYMENTS
================================================================ */

export async function getAllPayments(limit = 50): Promise<IPayment[]> {
  try {
    const conn = await connectToDatabase();
    if (!conn) return [];

    const safeLimit = Math.min(
      100,
      Math.max(1, Number(limit) || 50),
    );

    const docs = await PaymentModel.find({})
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();

    return docs as unknown as IPayment[];
  } catch (error) {
    console.error('Error fetching all payments:', error);
    return [];
  }
}