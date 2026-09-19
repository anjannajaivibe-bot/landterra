import {
  IProperty,
  IPropertyImage,
} from "@/types/property";
import { PropertyModel } from "@/models/Property";
import { connectToDatabase } from "@/lib/db/mongodb";
import {
  calculateAuthoritativeFees,
  UpdatePropertyInput,
} from "@/lib/validation/property";
import { deleteFilesFromStorage } from "@/services/upload.service";
import { enqueueAndDispatchExpiringSoonEmail } from "@/services/email.service";
import { createAuditLog } from "@/services/audit.service";
import { invalidatePropertyCache } from "./property-cache";
import { getPropertyById } from "./property-query.service";
import {
  isValidObjectId,
  hasOwn,
  sanitizePropertyUpdates,
  hasMaterialPropertyChange,
  PropertyUpdateInput,
} from "./property-helpers";
import {
  scanListingContentForSpam,
  SpamContentValidationError,
} from "./property-spam-filter";

/* ================================================================
   SUBSCRIPTION EXPIRY SYNCHRONIZATION (B-5)
================================================================ */

/**
 * Proactively marks all properties whose subscription has expired as 'EXPIRED'.
 * Transitions both PUBLISHED and EXPIRING_SOON listings whose subscriptionExpiresAt <= now.
 */
export async function syncExpiredProperties(options?: {
  sendAlerts?: boolean;
}): Promise<{
  matchedCount: number;
  modifiedCount: number;
  expiringAlertsSent?: number;
}> {
  await connectToDatabase();
  const now = new Date();

  // 1. Transition past-expiry properties to EXPIRED
  const result = await PropertyModel.updateMany(
    {
      listingStatus: { $in: ['PUBLISHED', 'EXPIRING_SOON'] },
      subscriptionExpiresAt: { $lte: now },
    },
    {
      $set: { listingStatus: 'EXPIRED', updatedAt: now },
    }
  );

  let alertsSent = 0;

  // 2. Transition active listings expiring in the next 7 days to EXPIRING_SOON and dispatch reminder emails
  // Isolated to scheduled cron execution (sendAlerts: true) to prevent latency during search/browse queries
  if (options?.sendAlerts) {
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringProperties = await PropertyModel.find({
      listingStatus: { $in: ['PUBLISHED', 'EXPIRING_SOON'] },
      subscriptionExpiresAt: { $gt: now, $lte: sevenDaysFromNow },
    }).lean();

    for (const prop of expiringProperties) {
      if (!prop.subscriptionExpiresAt || !prop.sellerEmail) continue;

      // Transition to EXPIRING_SOON if still PUBLISHED
      if (prop.listingStatus === 'PUBLISHED') {
        await PropertyModel.findByIdAndUpdate(prop._id, {
          $set: { listingStatus: 'EXPIRING_SOON', updatedAt: now },
        });
      }

      const diffMs = new Date(prop.subscriptionExpiresAt).getTime() - now.getTime();
      const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      // 7-day alert (when 3 <= daysRemaining <= 7)
      if (daysRemaining <= 7 && daysRemaining > 2) {
        const dispatched = await enqueueAndDispatchExpiringSoonEmail({
          eventKey: `expiring_soon_${prop._id}_7d`,
          recipientEmail: prop.sellerEmail,
          recipientName: prop.sellerName || 'Landowner',
          propertyTitle: prop.title,
          daysRemaining,
          propertyId: String(prop._id),
        }).catch((err: unknown) => {
          console.error(`Expiring soon 7d email error for ${prop._id}:`, err);
          return false;
        });
        if (dispatched) alertsSent++;
      }

      // 2-day urgent alert (when daysRemaining <= 2)
      if (daysRemaining <= 2) {
        const dispatched = await enqueueAndDispatchExpiringSoonEmail({
          eventKey: `expiring_soon_${prop._id}_2d`,
          recipientEmail: prop.sellerEmail,
          recipientName: prop.sellerName || 'Landowner',
          propertyTitle: prop.title,
          daysRemaining,
          propertyId: String(prop._id),
        }).catch((err: unknown) => {
          console.error(`Expiring soon 2d email error for ${prop._id}:`, err);
          return false;
        });
        if (dispatched) alertsSent++;
      }
    }
  }

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    expiringAlertsSent: alertsSent,
  };
}

/* ================================================================
   UPDATE PROPERTY
================================================================ */

/**
 * Update property data.
 *
 * Financial values are NEVER trusted from the caller.
 *
 * Material property changes trigger re-verification.
 */
export async function updateProperty(
  id: string,
  updates: Partial<IProperty> | Record<string, unknown>,
): Promise<IProperty | null> {
  if (
    !id ||
    !isValidObjectId(id)
  ) {
    return null;
  }

  const existing =
    await getPropertyById(id);

  if (!existing) {
    return null;
  }

  const incoming =
    {
      ...updates,
    } as PropertyUpdateInput;

  const propertyUpdates =
    sanitizePropertyUpdates(
      incoming,
    );

  /*
   * ------------------------------------------------------------
   * CONTENT ANTI-SPAM & SCAM KEYWORD CHECK ON UPDATE
   * ------------------------------------------------------------
   */
  if (incoming.title !== undefined || incoming.description !== undefined) {
    const titleToCheck = incoming.title !== undefined ? String(incoming.title) : String(existing.title || '');
    const descToCheck = incoming.description !== undefined ? String(incoming.description) : String(existing.description || '');
    const updateSpamScan = scanListingContentForSpam(titleToCheck, descToCheck);
    if (updateSpamScan.isBlocked) {
      throw new SpamContentValidationError(updateSpamScan.blockedReason);
    }
    if (updateSpamScan.isSuspicious) {
      propertyUpdates.verificationStatus = 'VERIFICATION_REQUIRED';
      propertyUpdates.rejectionReason = `Flagged by automated anti-spam scanner for terms: ${updateSpamScan.flaggedTerms.join(', ')}`;
    }
  }

  /*
   * ------------------------------------------------------------
   * AUTHORITATIVE PRICE CALCULATION
   * ------------------------------------------------------------
   */

  const priceChanged =
    hasOwn(
      incoming,
      'pricePerYard',
    );

  const areaChanged =
    hasOwn(
      incoming,
      'landAreaYards',
    );

  if (
    priceChanged ||
    areaChanged
  ) {
    const area =
      areaChanged
        ? Number(
          incoming.landAreaYards,
        )
        : existing.landAreaYards;

    const price =
      priceChanged
        ? Number(
          incoming.pricePerYard,
        )
        : existing.pricePerYard;

    if (
      !Number.isFinite(area) ||
      !Number.isFinite(price) ||
      area <= 0 ||
      price <= 0
    ) {
      throw new Error(
        'Invalid land area or price per yard.',
      );
    }

    const calculated =
      calculateAuthoritativeFees(
        area,
        price,
      );

    propertyUpdates.landAreaYards =
      calculated.landAreaYards;

    propertyUpdates.pricePerYard =
      calculated.pricePerYard;

    propertyUpdates.totalPrice =
      calculated.totalPrice;

    propertyUpdates.monthlyListingFee =
      calculated.monthlyListingFee;

    propertyUpdates.publishingFee =
      calculated.publishingFee;
  }

  /*
   * ------------------------------------------------------------
   * DIRECT CLASSIFIEDS MODEL — IN-PLACE PROPERTY UPDATES
   * ------------------------------------------------------------
   * In the direct classifieds marketplace model, an update to property
   * details by an authenticated landowner preserves its current published
   * status without moving the listing to an admin verification queue.
   */
  if (existing.listingStatus === 'PUBLISHED') {
    propertyUpdates.listingStatus = 'PUBLISHED';
  }

  if (
    typeof propertyUpdates.longitude === 'number' &&
    typeof propertyUpdates.latitude === 'number' &&
    !isNaN(propertyUpdates.longitude) &&
    !isNaN(propertyUpdates.latitude)
  ) {
    propertyUpdates.locationCoordinates = {
      type: 'Point',
      coordinates: [propertyUpdates.longitude, propertyUpdates.latitude],
    };
  }

  /*
   * Always let MongoDB maintain the update timestamp.
   */

  propertyUpdates.updatedAt =
    new Date();

  // Ensure exactly one primary image when images are updated
  if (Array.isArray(propertyUpdates.images) && propertyUpdates.images.length > 0) {
    let primaryFound = false;
    const normalizedImages: IPropertyImage[] = propertyUpdates.images.map(
      (img: Partial<IPropertyImage>, index: number): IPropertyImage => {
        let isPrimary = Boolean(img.isPrimary);
        if (isPrimary && !primaryFound) {
          primaryFound = true;
        } else if (isPrimary && primaryFound) {
          isPrimary = false;
        }
        return {
          ...img,
          secureUrl: img.secureUrl || '',
          isPrimary,
          sortOrder: img.sortOrder ?? index,
        };
      }
    );
    if (!primaryFound && normalizedImages.length > 0) {
      normalizedImages[0].isPrimary = true;
    }
    propertyUpdates.images = normalizedImages;
  }

  const conn =
    await connectToDatabase();

  if (!conn) {
    return null;
  }

  const updated =
    await PropertyModel.findByIdAndUpdate(
      id,
      {
        $set: propertyUpdates,
      },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    ).lean();

  if (!updated) {
    return null;
  }

  // Automatically delete any removed media files from Cloudflare R2
  const orphanedKeys: string[] = [];

  // 1. Removed images
  if (Array.isArray(incoming.images) && Array.isArray(existing.images)) {
    const newImageKeys = new Set(
      (incoming.images as any[]).map((img) => img?.objectKey).filter(Boolean)
    );
    for (const oldImg of existing.images) {
      if (oldImg?.objectKey && !newImageKeys.has(oldImg.objectKey)) {
        orphanedKeys.push(oldImg.objectKey);
      }
    }
  }

  // 2. Replaced or removed video
  if ('video' in incoming && existing.video?.objectKey) {
    const newVideoKey = (incoming.video as any)?.objectKey;
    if (newVideoKey !== existing.video.objectKey) {
      orphanedKeys.push(existing.video.objectKey);
    }
  }

  // 3. Removed documents
  if (Array.isArray(incoming.documents) && Array.isArray(existing.documents)) {
    const newDocKeys = new Set(
      (incoming.documents as any[]).map((doc) => doc?.objectKey).filter(Boolean)
    );
    for (const oldDoc of existing.documents) {
      if (oldDoc?.objectKey && !newDocKeys.has(oldDoc.objectKey)) {
        orphanedKeys.push(oldDoc.objectKey);
      }
    }
  }

  if (orphanedKeys.length > 0) {
    deleteFilesFromStorage(orphanedKeys).catch((err) => {
      console.warn('Failed to delete orphaned media from R2 on property update:', err);
    });
  }

  invalidatePropertyCache();

  return updated as unknown as IProperty;
}

/* ================================================================
   DELETE PROPERTY
================================================================ */

/**
 * Permanently delete property and purge all associated media from Cloudflare R2.
 */
export async function deleteProperty(
  id: string,
): Promise<boolean> {
  if (
    !id ||
    !isValidObjectId(id)
  ) {
    return false;
  }

  const conn =
    await connectToDatabase();

  if (!conn) {
    return false;
  }

  // 1. Fetch property to identify all associated media keys
  const property = await PropertyModel.findById(id).lean();
  if (!property) {
    return false;
  }

  // 2. Collect all R2 keys (images, video, documents)
  const keysToDelete: string[] = [];
  if (Array.isArray(property.images)) {
    for (const img of property.images) {
      if (img?.objectKey) keysToDelete.push(img.objectKey);
    }
  }
  if (property.video?.objectKey) {
    keysToDelete.push(property.video.objectKey);
  }
  if (Array.isArray(property.documents)) {
    for (const doc of property.documents) {
      if (doc?.objectKey) keysToDelete.push(doc.objectKey);
    }
  }

  // 3. Purge all media from Cloudflare R2
  if (keysToDelete.length > 0) {
    await deleteFilesFromStorage(keysToDelete).catch((err) => {
      console.warn('Failed to delete media files from R2 during property deletion:', err);
    });
  }

  // 4. Delete property document from MongoDB
  const result =
    await PropertyModel.deleteOne({ _id: id });

  invalidatePropertyCache();

  return (result.deletedCount || 0) > 0;
}

/* ================================================================
   MARK SOLD
================================================================ */

export async function markPropertyAsSold(
  id: string,
): Promise<IProperty | null> {
  if (
    !id ||
    !isValidObjectId(id)
  ) {
    return null;
  }

  const property =
    await getPropertyById(id);

  if (!property) {
    return null;
  }

  if (
    property.listingStatus ===
    'DELETED'
  ) {
    return null;
  }

  return updateProperty(
    id,
    {
      /*
       * updateProperty deliberately protects lifecycle fields.
       *
       * Therefore SOLD needs a dedicated database operation.
       */
    },
  ).then(async () => {
    const conn =
      await connectToDatabase();

    if (!conn) {
      return null;
    }

    const updated =
      await PropertyModel.findByIdAndUpdate(
        id,
        {
          $set: {
            listingStatus:
              'SOLD',

            updatedAt:
              new Date(),
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      ).lean();

    invalidatePropertyCache();

    return updated
      ? (updated as unknown as IProperty)
      : null;
  });
}

/* ================================================================
   PAUSE / UNPAUSE
================================================================ */

export async function togglePropertyPause(
  id: string,
): Promise<IProperty | null> {
  if (
    !id ||
    !isValidObjectId(id)
  ) {
    return null;
  }

  const property =
    await getPropertyById(id);

  if (!property) {
    return null;
  }

  if (
    property.listingStatus ===
    'DELETED' ||
    property.listingStatus ===
    'SOLD'
  ) {
    return null;
  }

  const newStatus =
    property.listingStatus ===
      'PAUSED'
      ? 'PUBLISHED'
      : 'PAUSED';

  const conn =
    await connectToDatabase();

  if (!conn) {
    return null;
  }

  const updated =
    await PropertyModel.findByIdAndUpdate(
      id,
      {
        $set: {
          listingStatus:
            newStatus,

          updatedAt:
            new Date(),
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    ).lean();

  invalidatePropertyCache();

  return updated
    ? (updated as unknown as IProperty)
    : null;
}

/* ================================================================
   RENEW SUBSCRIPTION
================================================================ */

/**
 * Renew a property listing for 30 days.
 *
 * Payment state itself belongs to the Payment / Subscription
 * system. This function only updates the property's subscription
 * period and marketplace lifecycle.
 */
export async function renewPropertySubscription(
  id: string,
  _razorpayOrderId?: string,
  _razorpayPaymentId?: string,
): Promise<IProperty | null> {
  if (
    !id ||
    !isValidObjectId(id)
  ) {
    return null;
  }

  const property =
    await getPropertyById(id);

  if (!property) {
    return null;
  }

  if (
    property.listingStatus ===
    'DELETED'
  ) {
    return null;
  }

  const now =
    new Date();

  const baseDate =
    property.subscriptionExpiresAt &&
      new Date(
        property.subscriptionExpiresAt,
      ) > now
      ? new Date(
        property.subscriptionExpiresAt,
      )
      : now;

  const newExpiry =
    new Date(
      baseDate.getTime() +
      30 *
      24 *
      60 *
      60 *
      1000,
    );

  /*
   * DIRECT CLASSIFIEDS MODEL — INSTANT LIVE PUBLISHING
   *
   * In the direct classifieds marketplace model, activating a paid
   * subscription publishes the listing live directly on the marketplace.
   */
  const nextListingStatus = 'PUBLISHED';

  const conn =
    await connectToDatabase();

  if (!conn) {
    return null;
  }

  const updated =
    await PropertyModel.findByIdAndUpdate(
      id,
      {
        $set: {
          listingStatus:
            nextListingStatus,

          subscriptionStartedAt:
            property.subscriptionStartedAt ||
            now,

          subscriptionExpiresAt:
            newExpiry,

          updatedAt:
            now,
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    ).lean();

  invalidatePropertyCache();

  return updated
    ? (updated as unknown as IProperty)
    : null;
}


/* ================================================================
   SUBMIT PROPERTY FOR ADMIN REVIEW
================================================================ */

export async function submitPropertyForReview(
  id: string,
): Promise<IProperty | null> {
  if (!id || !isValidObjectId(id)) {
    return null;
  }

  const existing = await getPropertyById(id);

  if (!existing) {
    return null;
  }

  if (
    existing.listingStatus === 'DELETED' ||
    existing.listingStatus === 'SOLD'
  ) {
    throw new Error(
      'This listing cannot be submitted for review in its current state.',
    );
  }

  await connectToDatabase();

  const nextVerificationStatus =
    existing.verificationStatus === 'VERIFICATION_REQUIRED'
      ? 'VERIFICATION_REQUIRED'
      : 'PENDING';

  const updated = await PropertyModel.findByIdAndUpdate(
    id,
    {
      $set: {
        listingStatus: 'PENDING_VERIFICATION',
        verificationStatus: nextVerificationStatus,
        updatedAt: new Date(),
      },
      $unset: {
        rejectionReason: 1,
        verificationReviewedAt: 1,
        verificationReviewedBy: 1,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  invalidatePropertyCache();

  return updated
    ? (updated as unknown as IProperty)
    : null;
}
