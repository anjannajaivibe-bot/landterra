import { EmailDeliveryModel } from "@/models/EmailDelivery";
import { connectToDatabase } from "@/lib/db/mongodb";
import {
  notifyListingSubmitted,
  notifyExpiringSoon,
} from "./email-templates.service";

/**
 * Reliable Outbox Email Dispatch
 * Ensures emails are idempotent via unique eventKey and retried if transmission fails.
 */
export async function enqueueAndDispatchPaymentEmail({
  eventKey,
  recipientEmail,
  recipientName,
  propertyTitle,
  publishingFee,
  isRenewal = false,
}: {
  eventKey: string;
  recipientEmail: string;
  recipientName: string;
  propertyTitle: string;
  publishingFee: number;
  isRenewal?: boolean;
}): Promise<boolean> {
  if (!recipientEmail) return false;

  await connectToDatabase();

  const delivery = await EmailDeliveryModel.findOneAndUpdate(
    { eventKey },
    {
      $setOnInsert: {
        eventKey,
        recipientEmail,
        recipientName,
        template: isRenewal ? 'SUBSCRIPTION_RENEWED' : 'LISTING_SUBMITTED',
        payload: { propertyTitle, publishingFee, isRenewal },
        status: 'PENDING',
        attempts: 0,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  if (!delivery || delivery.status === 'SENT') {
    return true; // Already sent
  }

  // Attempt dispatch
  try {
    delivery.attempts = (delivery.attempts || 0) + 1;
    delivery.lastAttemptAt = new Date();

    const result = await notifyListingSubmitted(
      recipientEmail,
      recipientName,
      propertyTitle,
      publishingFee,
    );

    if (result.success) {
      delivery.status = 'SENT';
      delivery.sentAt = new Date();
      delivery.errorMessage = undefined;
      await delivery.save();
      return true;
    } else {
      delivery.status = 'FAILED';
      delivery.errorMessage = result.error || 'Email dispatch failed';
      await delivery.save();
      return false;
    }
  } catch (err: unknown) {
    delivery.status = 'FAILED';
    delivery.errorMessage =
      err instanceof Error ? err.message : 'Unknown exception';
    await delivery.save();
    return false;
  }
}

/**
 * Idempotent Dispatcher for Expiring Soon Alert Emails
 * Keyed by eventKey to guarantee at most 1 email per alert threshold (e.g. 7d or 2d).
 */
export async function enqueueAndDispatchExpiringSoonEmail({
  eventKey,
  recipientEmail,
  recipientName,
  propertyTitle,
  daysRemaining,
  propertyId,
}: {
  eventKey: string;
  recipientEmail: string;
  recipientName: string;
  propertyTitle: string;
  daysRemaining: number;
  propertyId: string;
}): Promise<boolean> {
  if (!recipientEmail) return false;

  await connectToDatabase();

  const delivery = await EmailDeliveryModel.findOneAndUpdate(
    { eventKey },
    {
      $setOnInsert: {
        eventKey,
        recipientEmail,
        recipientName,
        template: 'EXPIRING_SOON_REMINDER',
        payload: { propertyTitle, daysRemaining, propertyId },
        status: 'PENDING',
        attempts: 0,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  if (!delivery || delivery.status === 'SENT') {
    return true; // Already successfully dispatched
  }

  try {
    delivery.attempts = (delivery.attempts || 0) + 1;
    delivery.lastAttemptAt = new Date();

    const result = await notifyExpiringSoon(
      recipientEmail,
      recipientName,
      propertyTitle,
      daysRemaining,
      propertyId
    );

    if (result.success) {
      delivery.status = 'SENT';
      delivery.sentAt = new Date();
      delivery.errorMessage = undefined;
      await delivery.save();
      return true;
    } else {
      delivery.status = 'FAILED';
      delivery.errorMessage = result.error || 'Email dispatch failed';
      await delivery.save();
      return false;
    }
  } catch (err: unknown) {
    delivery.status = 'FAILED';
    delivery.errorMessage = err instanceof Error ? err.message : 'Unknown exception';
    await delivery.save();
    return false;
  }
}

