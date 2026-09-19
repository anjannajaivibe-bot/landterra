import { IProperty } from "@/types/property";

export type PropertyUpdateInput =
  Partial<IProperty> &
  Record<string, unknown>;

/**
 * Escape user-provided text before creating a MongoDB regex.
 *
 * Without this, characters such as:
 * . * + ? ( ) [ ] { } |
 * can change the meaning of the search regex.
 */
export function escapeRegex(value: string): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  );
}

/**
 * Check whether an object contains a property,
 * even when the value is 0, false, or an empty string.
 */
export function hasOwn(
  object: Record<string, unknown>,
  key: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(
    object,
    key,
  );
}

/**
 * Validate MongoDB ObjectId before calling findById.
 */
export function isValidObjectId(
  id: string,
): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

/**
 * Remove fields that must never be changed through
 * the generic property update service.
 *
 * Seller identity belongs to the authenticated User.
 */
export function sanitizePropertyUpdates(
  updates: PropertyUpdateInput,
): PropertyUpdateInput {
  const safe = {
    ...updates,
  };

  delete safe._id;
  delete safe.sellerId;

  delete safe.sellerName;
  delete safe.sellerEmail;
  delete safe.sellerPhone;
  delete safe.sellerType;

  delete safe.createdAt;
  delete safe.updatedAt;

  /*
   * These are server-controlled lifecycle and verification fields.
   * Legacy payment/subscription values are also protected here so generic
   * client PATCH requests cannot mutate historical billing metadata.
   */
  delete safe.paymentStatus;
  if (safe.listingStatus !== 'PAUSED' && safe.listingStatus !== 'PUBLISHED') {
    delete safe.listingStatus;
  }
  delete safe.verificationStatus;
  delete safe.verificationReviewedAt;
  delete safe.verificationReviewedBy;
  delete safe.publishedAt;
  delete safe.viewsCount;
  delete safe.inquiriesCount;
  delete safe.rejectionReason;
  delete safe.subscriptionStartedAt;
  delete safe.subscriptionExpiresAt;

  /*
   * Fees are authoritative server values.
   */
  delete safe.totalPrice;
  delete safe.publishingFee;
  delete safe.monthlyListingFee;

  return safe;
}

/**
 * Fields that materially affect property verification.
 */
export function hasMaterialPropertyChange(
  updates: PropertyUpdateInput,
): boolean {
  const materialFields = [
    'title',
    'description',
    'landAreaYards',
    'pricePerYard',
    'landType',
    'transactionType',
    'roadAccess',
    'nearbyLandmarks',
    'location',
    'googleMapsShareLink',
    'latitude',
    'longitude',
    'approximateLocation',
    'governmentRegistrationId',
    'images',
    'documents',
  ];

  return materialFields.some(
    (field) =>
      hasOwn(
        updates as Record<string, unknown>,
        field,
      ),
  );
}
