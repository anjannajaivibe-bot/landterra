import {
  IProperty,
  IPropertyImage,
  IPropertyDocument,
} from "@/types/property";
import { PropertyModel } from "@/models/Property";
import { connectToDatabase } from "@/lib/db/mongodb";
import {
  calculateAuthoritativeFees,
  CreatePropertyInput,
} from "@/lib/validation/property";
import { createAuditLog } from "@/services/audit.service";
import { invalidatePropertyCache } from "./property-cache";
import {
  scanListingContentForSpam,
  SpamContentValidationError,
} from "./property-spam-filter";

export class SellerListingLimitError extends Error {
  public status = 403;

  constructor(
    message = 'You have reached the maximum allowed limit of 2 listings for this account, phone, or email. Please manage or delete an existing listing before creating a new one.'
  ) {
    super(message);
    this.name = 'SellerListingLimitError';
  }
}

export class DuplicatePropertyError extends Error {
  public status = 409;
  public duplicateId?: string;

  constructor(message = 'You already have an active listing for this property.', duplicateId?: string) {
    super(message);
    this.name = 'DuplicatePropertyError';
    this.duplicateId = duplicateId;
  }
}

/**
 * Create a new property listing.
 *
 * IMPORTANT:
 * Financial values are always calculated here.
 * Browser-provided totalPrice / publishingFee values
 * are ignored.
 */
export type InitialListingStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION';

export async function createProperty(
  data: CreatePropertyInput,
  initialListingStatus: InitialListingStatus = 'DRAFT',
): Promise<IProperty> {
  const area = Number(data.landAreaYards);
  const transactionType = data.transactionType || 'SALE';
  const monthlyAmount = Number(data.monthlyRent || 0);

  const normalizedPricePerYard =
    transactionType === 'SALE'
      ? Number(data.pricePerYard)
      : Math.max(
          1,
          Math.round(
            monthlyAmount /
              Math.max(area, 1),
          ),
        );

  if (
    !Number.isFinite(area) ||
    area <= 0 ||
    !Number.isFinite(normalizedPricePerYard) ||
    normalizedPricePerYard <= 0 ||
    (transactionType !== 'SALE' &&
      (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0))
  ) {
    throw new Error(
      transactionType === 'SALE'
        ? 'Invalid property area or asking price.'
        : 'Invalid property area or monthly rent / lease amount.',
    );
  }

  /*
   * Keep the legacy normalized price fields for search compatibility.
   * BhoomiMitra no longer charges a listing publishing fee.
   */

  const {
    landAreaYards,
    pricePerYard,
    totalPrice: calculatedTotalPrice,
  } = calculateAuthoritativeFees(
    area,
    normalizedPricePerYard,
    0,
  );

  const totalPrice =
    transactionType === 'SALE'
      ? calculatedTotalPrice
      : monthlyAmount;

  const publishingFee = 0;
  const monthlyListingFee = 0;

  await connectToDatabase();

  /*
   * ------------------------------------------------------------
   * SELLER LISTING LIMIT & CONTENT-LEVEL DUPLICATE GUARD (B-6)
   * ------------------------------------------------------------
   * 1. Strictly scoped to the SAME seller: matched across sellerId,
   *    sellerEmail, or phone number to prevent multi-account evasion.
   *    Different users listing properties in the same area/pincode
   *    are NEVER blocked.
   * 2. Limit: A seller may have at most 2 active listings
   *    (DRAFT, legacy PAYMENT_PENDING, PENDING_VERIFICATION, PUBLISHED, or EXPIRING_SOON).
   * 3. Deep Duplicate Detection: If a seller lists the same property
   *    again, detect it by checking for identical documents, images,
   *    videos, or exact matching title + land area + pincode.
   */
  if (data.sellerId) {
    const sellerConditions: Record<string, unknown>[] = [{ sellerId: data.sellerId }];

    if (data.sellerEmail && typeof data.sellerEmail === 'string' && data.sellerEmail.trim()) {
      sellerConditions.push({ sellerEmail: data.sellerEmail.trim().toLowerCase() });
    }

    if (data.sellerPhone && typeof data.sellerPhone === 'string' && data.sellerPhone.trim()) {
      const cleanPhone = data.sellerPhone.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        sellerConditions.push({ sellerPhone: { $regex: cleanPhone.slice(-10) } });
      }
    }

    const existingSellerProperties = await PropertyModel.find({
      $or: sellerConditions,
      listingStatus: { $in: ['DRAFT', 'PAYMENT_PENDING', 'PENDING_VERIFICATION', 'PUBLISHED', 'EXPIRING_SOON'] },
    }).lean();

    // Rule 1: Max 2 active/draft listings per seller
    if (existingSellerProperties.length >= 2) {
      throw new SellerListingLimitError(
        'You have reached the maximum allowed limit of 2 active or draft listings for your account, email, or phone number. Please manage or remove an existing listing before creating a new one.'
      );
    }

    // Rule 2: Deep content-level duplicate detection for the same seller
    const newDocKeys = new Set(
      (data.documents || []).map((d: Partial<IPropertyDocument>) => d?.objectKey).filter(Boolean)
    );
    const newImageKeys = new Set(
      (data.images || []).map((img: Partial<IPropertyImage>) => img?.objectKey).filter(Boolean)
    );
    const newVideoKey = data.video?.objectKey;
    const normalizedNewTitle = String(data.title || '').trim().toLowerCase();
    const newPincode = String(data.location?.pincode || '').trim();

    for (const existing of existingSellerProperties) {
      // Check 2a: Matching uploaded documents (e.g. same deed, 7/12, tax receipt)
      if (Array.isArray(existing.documents) && newDocKeys.size > 0) {
        for (const doc of existing.documents) {
          if (doc?.objectKey && newDocKeys.has(doc.objectKey)) {
            throw new DuplicatePropertyError(
              'This listing contains documents identical to an existing property in your account. Please update your existing listing instead of submitting duplicates.',
              String(existing._id)
            );
          }
        }
      }

      // Check 2b: Matching uploaded images
      if (Array.isArray(existing.images) && newImageKeys.size > 0) {
        let matchingImagesCount = 0;
        for (const img of existing.images) {
          if (img?.objectKey && newImageKeys.has(img.objectKey)) {
            matchingImagesCount++;
          }
        }
        if (matchingImagesCount > 0) {
          throw new DuplicatePropertyError(
            'This listing contains photos identical to an existing property in your account. Please update your existing listing instead of submitting duplicates.',
            String(existing._id)
          );
        }
      }

      // Check 2c: Matching video
      if (existing.video?.objectKey && newVideoKey && existing.video.objectKey === newVideoKey) {
        throw new DuplicatePropertyError(
          'This listing contains a video identical to an existing property in your account. Please update your existing listing instead of submitting duplicates.',
          String(existing._id)
        );
      }

      // Check 2d: Matching title + land area + pincode
      const existingTitle = String(existing.title || '').trim().toLowerCase();
      const existingPincode = String(existing.location?.pincode || '').trim();
      if (
        normalizedNewTitle &&
        existingTitle === normalizedNewTitle &&
        existing.landAreaYards === landAreaYards &&
        newPincode &&
        existingPincode === newPincode
      ) {
        throw new DuplicatePropertyError(
          'You already have an active listing with this exact title, area, and pincode. Please update your existing listing instead of creating a duplicate.',
          String(existing._id)
        );
      }
    }
  }

  /*
   * ------------------------------------------------------------
   * RULE 3: AUTOMATED PRE-SUBMISSION ANTI-SPAM & SCAM FILTER
   * ------------------------------------------------------------
   */
  const spamScan = scanListingContentForSpam(data.title, data.description);
  if (spamScan.isBlocked) {
    throw new SpamContentValidationError(spamScan.blockedReason);
  }

  /*
   * Images.
   */

  let primaryFound = false;
  const formattedImages = (data.images || []).map((img: Partial<IPropertyImage>, index: number) => {
    let isPrimary = Boolean(img.isPrimary);
    if (isPrimary && !primaryFound) {
      primaryFound = true;
    } else if (isPrimary && primaryFound) {
      isPrimary = false;
    }
    return {
      objectKey: img.objectKey,
      secureUrl: img.secureUrl,
      fileName: img.fileName || 'image.jpg',
      mimeType: img.mimeType || 'image/jpeg',
      size: img.size || 0,
      isPrimary,
      sortOrder: img.sortOrder ?? index,
    };
  });

  if (!primaryFound && formattedImages.length > 0) {
    formattedImages[0].isPrimary = true;
  }

  /*
   * Documents always start as PENDING.
   */

  const formattedDocs =
    (
      data.documents || []
    ).map(
      (doc: Partial<IPropertyDocument>) => ({
        sellerId:
          data.sellerId,

        documentType:
          doc.documentType ||
          'TITLE_DEED',

        objectKey:
          doc.objectKey,

        fileName:
          doc.fileName ||
          'document.pdf',

        mimeType:
          doc.mimeType ||
          'application/pdf',

        size:
          doc.size || 0,

        verificationStatus:
          'PENDING' as const,

        uploadedAt:
          new Date(),
      }),
    );

  /*
   * Seller identity is supplied by the authenticated route.
   *
   * This service still requires sellerId because it is the
   * authoritative owner of the created property.
   */

  if (!data.sellerId) {
    throw new Error(
      'Seller identity is required.',
    );
  }

  const newPropertyData = {
    sellerId:
      data.sellerId,

    sellerName:
      data.sellerName ||
      'Seller',

    sellerPhone:
      data.sellerPhone,

    sellerEmail:
      data.sellerEmail,

    sellerType:
      data.sellerType ||
      'INDIVIDUAL',

    title:
      data.title,

    description:
      data.description,

    /*
     * Authoritative financial values.
     */

    landAreaYards,

    pricePerYard,

    totalPrice,

    priceNegotiable:
      Boolean(
        data.priceNegotiable,
      ),

    transactionType,

    publishingFee,

    monthlyListingFee,

    /*
     * Legacy subscription timestamps remain unset for free listings.
     */

    subscriptionStartedAt:
      undefined,

    subscriptionExpiresAt:
      undefined,

    landType:
      data.landType ||
      'RESIDENTIAL_PLOT',

    propertyType:
      data.propertyType ||
      data.landType ||
      'RESIDENTIAL_PLOT',

    bhk: data.bhk,
    facing: data.facing,
    floorNumber: data.floorNumber,
    totalFloors: data.totalFloors,
    furnishingStatus: data.furnishingStatus,
    bathrooms: data.bathrooms,
    balconies: data.balconies,
    carpetAreaSqFt: data.carpetAreaSqFt,
    superBuiltUpAreaSqFt: data.superBuiltUpAreaSqFt,
    boundaryWall: data.boundaryWall,
    cornerPlot: Boolean(data.cornerPlot),
    gatedCommunity: Boolean(data.gatedCommunity),
    amenities: data.amenities || [],
    approvals: data.approvals || [],
    waterSource: data.waterSource || [],
    electricityPhase: data.electricityPhase,
    soilType: data.soilType,
    propertyAttributes: {
      ...(data.propertyAttributes || {}),
      monthlyRent:
        transactionType === 'SALE'
          ? undefined
          : monthlyAmount,
    },

    roadAccess:
      data.roadAccess ||
      'Road access available',

    nearbyLandmarks:
      data.nearbyLandmarks ||
      [],

    location:
      data.location,

    googleMapsShareLink:
      data.googleMapsShareLink ||
      '',

    latitude:
      data.latitude,

    longitude:
      data.longitude,

    locationCoordinates:
      typeof data.longitude === 'number' && typeof data.latitude === 'number' && !isNaN(data.longitude) && !isNaN(data.latitude)
        ? {
            type: 'Point' as const,
            coordinates: [data.longitude, data.latitude] as [number, number],
          }
        : undefined,

    approximateLocation:
      Boolean(
        data.approximateLocation,
      ),

    governmentRegistrationId:
      data.governmentRegistrationId ||
      '',

    /*
     * New listings verification status (flagged if suspicious terms detected).
     */

    verificationStatus: spamScan.isSuspicious
      ? ('VERIFICATION_REQUIRED' as const)
      : ('PENDING' as const),

    rejectionReason: spamScan.isSuspicious
      ? `Flagged by automated anti-spam scanner for terms: ${spamScan.flaggedTerms.join(', ')}`
      : undefined,

    /*
     * Drafts stay private. Submitted listings wait for platform review.
     */

    listingStatus:
      initialListingStatus,

    images:
      formattedImages,

    documents:
      formattedDocs,

    viewsCount: 0,

    inquiriesCount: 0,
  };

  const conn =
    await connectToDatabase();

  if (!conn) {
    throw new Error(
      'Database is not connected. Unable to create property listing.',
    );
  }

  const created =
    await PropertyModel.create(
      newPropertyData,
    );

  if (spamScan.isSuspicious && data.sellerId) {
    createAuditLog({
      actorId: data.sellerId,
      actorName: data.sellerName || 'Seller',
      actorEmail: data.sellerEmail || '',
      actorRole: 'SELLER',
      action: 'PROPERTY_SPAM_FLAGGED',
      entityType: 'PROPERTY',
      entityId: String(created._id),
      metadata: {
        title: data.title,
        flaggedTerms: spamScan.flaggedTerms,
      },
    }).catch((err: unknown) => {
      console.warn('[AuditLog] Failed to record spam moderation flag:', err);
    });
  }

  invalidatePropertyCache();

  return created.toObject() as unknown as IProperty;
}
