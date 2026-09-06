import {
  IProperty,
  IPublicProperty,
  PropertyFilterParams,
  PaginatedResponse,
} from '@/types/property';

import { PropertyModel } from '@/models/Property';

import { connectToDatabase } from '@/lib/db/mongodb';

import {
  calculateAuthoritativeFees,
} from '@/lib/validation/property';

import { deleteFilesFromStorage } from '@/services/upload.service';

/* ================================================================
   TYPES
================================================================ */

type PropertyUpdateInput =
  Partial<IProperty> &
  Record<string, unknown>;

/* ================================================================
   PUBLIC MARKETPLACE PROJECTION & SERIALIZER
================================================================ */

/**
 * MongoDB projection for public marketplace listing queries.
 *
 * Excludes sensitive seller contact details (sellerPhone, sellerEmail),
 * sellerName, sellerId, private documents, internal admin verification
 * tracking, internal upload objectKeys, and billing metadata.
 */
export const PUBLIC_PROPERTY_PROJECTION = {
  _id: 1,
  title: 1,
  description: 1,
  landAreaYards: 1,
  pricePerYard: 1,
  totalPrice: 1,
  priceNegotiable: 1,
  landType: 1,
  propertyType: 1,
  bhk: 1,
  facing: 1,
  floorNumber: 1,
  totalFloors: 1,
  furnishingStatus: 1,
  bathrooms: 1,
  balconies: 1,
  carpetAreaSqFt: 1,
  superBuiltUpAreaSqFt: 1,
  boundaryWall: 1,
  cornerPlot: 1,
  gatedCommunity: 1,
  amenities: 1,
  approvals: 1,
  waterSource: 1,
  electricityPhase: 1,
  soilType: 1,
  propertyAttributes: 1,
  roadAccess: 1,
  nearbyLandmarks: 1,
  location: 1,
  approximateLocation: 1,
  verificationStatus: 1,
  listingStatus: 1,
  sellerType: 1,
  'images._id': 1,
  'images.secureUrl': 1,
  'images.isPrimary': 1,
  'images.sortOrder': 1,
  'video.secureUrl': 1,
  'video.thumbnailUrl': 1,
  'video.duration': 1,
  publishedAt: 1,
  createdAt: 1,
  updatedAt: 1,
  viewsCount: 1,
} as const;

/**
 * Defense-in-depth serializer for public marketplace listing items.
 * Ensures the returned shape strictly adheres to IPublicProperty and
 * strips any inadvertent sensitive or private fields.
 */
export function toPublicPropertyListItem(
  doc: any,
): IProperty {
  const publicItem: IPublicProperty = {
    _id: String(doc._id),
    title: doc.title,
    description: doc.description,
    landAreaYards: doc.landAreaYards,
    pricePerYard: doc.pricePerYard,
    totalPrice: doc.totalPrice,
    priceNegotiable: doc.priceNegotiable,
    landType: doc.landType,
    propertyType: doc.propertyType,
    bhk: doc.bhk,
    facing: doc.facing,
    floorNumber: doc.floorNumber,
    totalFloors: doc.totalFloors,
    furnishingStatus: doc.furnishingStatus,
    bathrooms: doc.bathrooms,
    balconies: doc.balconies,
    carpetAreaSqFt: doc.carpetAreaSqFt,
    superBuiltUpAreaSqFt: doc.superBuiltUpAreaSqFt,
    boundaryWall: doc.boundaryWall,
    cornerPlot: doc.cornerPlot,
    gatedCommunity: doc.gatedCommunity,
    amenities: doc.amenities,
    approvals: doc.approvals,
    waterSource: doc.waterSource,
    electricityPhase: doc.electricityPhase,
    soilType: doc.soilType,
    propertyAttributes: doc.propertyAttributes,
    roadAccess: doc.roadAccess,
    nearbyLandmarks: doc.nearbyLandmarks,
    location: doc.location,
    approximateLocation: doc.approximateLocation,
    verificationStatus: doc.verificationStatus,
    listingStatus: doc.listingStatus,
    sellerType: doc.sellerType,
    images: Array.isArray(doc.images)
      ? doc.images.map((img: any) => ({
          _id: img._id ? String(img._id) : undefined,
          secureUrl: img.secureUrl,
          isPrimary: Boolean(img.isPrimary),
          sortOrder: typeof img.sortOrder === 'number' ? img.sortOrder : 0,
        }))
      : [],
    video: doc.video
      ? {
          secureUrl: doc.video.secureUrl,
          thumbnailUrl: doc.video.thumbnailUrl,
          duration: doc.video.duration,
        }
      : undefined,
    publishedAt: doc.publishedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    viewsCount: doc.viewsCount,
  };

  return publicItem as unknown as IProperty;
}

/* ================================================================
   HELPERS
================================================================ */

/**
 * Escape user-provided text before creating a MongoDB regex.
 *
 * Without this, characters such as:
 * . * + ? ( ) [ ] { } |
 * can change the meaning of the search regex.
 */
function escapeRegex(value: string): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  );
}

/**
 * Check whether an object contains a property,
 * even when the value is 0, false, or an empty string.
 */
function hasOwn(
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
function isValidObjectId(
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
function sanitizePropertyUpdates(
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
   * They should only be changed through dedicated payment /
   * verification / admin workflows rather than generic client PATCH.
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
function hasMaterialPropertyChange(
  updates: PropertyUpdateInput,
): boolean {
  const materialFields = [
    'title',
    'description',
    'landAreaYards',
    'pricePerYard',
    'landType',
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

/* ================================================================
   GET PROPERTIES
================================================================ */

/**
 * Get paginated & filtered properties.
 *
 * IMPORTANT:
 * This service defaults to public marketplace visibility.
 *
 * Management/admin-specific queries should ideally use
 * dedicated service methods rather than bypassing this
 * default accidentally.
 */
export async function getProperties(
  params: PropertyFilterParams = {},
): Promise<PaginatedResponse<IProperty>> {
  const page = Math.max(
    1,
    Number(params.page) || 1,
  );

  const limit = Math.min(
    50,
    Math.max(
      1,
      Number(params.limit) || 12,
    ),
  );

  const skip =
    (page - 1) * limit;

  try {
    const conn =
      await connectToDatabase();

    if (!conn) {
      return {
        data: [],
        total: 0,
        page,
        totalPages: 1,
        limit,
      };
    }

    const query: Record<
      string,
      unknown
    > = {};

    /*
     * ------------------------------------------------------------
     * VISIBILITY
     * ------------------------------------------------------------
     *
     * If sellerId is provided, this is treated as a management
     * query and the caller is responsible for authorization.
     *
     * Otherwise, only PUBLISHED listings are returned.
     */

    if (params.sellerId) {
      query.sellerId =
        params.sellerId;

      if (
        params.listingStatus &&
        params.listingStatus !== 'ALL'
      ) {
        query.listingStatus =
          params.listingStatus;
      } else {
        query.listingStatus = { $ne: 'DELETED' };
      }
    } else if (params.isAdmin) {
      if (
        params.listingStatus &&
        params.listingStatus !== 'ALL'
      ) {
        query.listingStatus =
          params.listingStatus;
      } else {
        query.listingStatus = { $ne: 'DELETED' };
      }
    } else {
      /*
       * Public marketplace:
       * NEVER allow arbitrary lifecycle states.
       */
      query.listingStatus =
        'PUBLISHED';
    }

    /*
     * ------------------------------------------------------------
     * STATUS FILTERING
     * ------------------------------------------------------------
     *
     * In the classifieds model, all PUBLISHED listings are visible.
     * Sellers may inspect their own properties by verificationStatus.
     */

    if ((params.sellerId || params.isAdmin) && params.verificationStatus && params.verificationStatus !== 'ALL') {
      query.verificationStatus = params.verificationStatus;
    }

    /*
     * ------------------------------------------------------------
     * COMPOUND AND-CONDITIONS LIST
     * ------------------------------------------------------------
     */
    const andConditions: Record<string, any>[] = [];

    /*
     * ------------------------------------------------------------
     * LAND TYPE / PROPERTY TYPE
     * ------------------------------------------------------------
     */

    const rawType = params.landType || params.propertyType;
    if (
      rawType &&
      rawType !== 'ALL'
    ) {
      const types = String(rawType)
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);

      if (types.length > 0) {
        const typeOrConditions: Record<string, any>[] = [];

        for (const t of types) {
          typeOrConditions.push({ landType: t });
          typeOrConditions.push({ propertyType: t });

          // Also match descriptive titles so existing or custom listings match correctly
          if (t === 'FLAT') {
            typeOrConditions.push({ title: /\b(flat|apartment|condo)\b/i });
          } else if (t === 'HOUSE_VILLA' || t === 'VILLA' || t === 'INDEPENDENT_HOUSE') {
            typeOrConditions.push({
              $and: [
                { title: /\b(house|villa|independent house|bungalow)\b/i },
                { title: { $not: /\bplot\b/i } },
              ],
            });
          } else if (t === 'TOWNHOUSE') {
            typeOrConditions.push({ title: /\btownhouse\b/i });
          } else if (t === 'DUPLEX') {
            typeOrConditions.push({ title: /\bduplex\b/i });
          } else if (t === 'PENTHOUSE') {
            typeOrConditions.push({ title: /\bpenthouse\b/i });
          } else if (t === 'OPEN_PLOT' || t === 'RESIDENTIAL_PLOT') {
            typeOrConditions.push({ title: /\b(residential\s*plot|open\s*plot)\b/i });
          } else if (t === 'FARMLAND_PLOT') {
            typeOrConditions.push({ title: /\bfarmland\s*plot\b/i });
          } else if (t === 'GATED_COMMUNITY_PLOT') {
            typeOrConditions.push({ title: /\bgated\s*(?:community\s*)?plot\b/i });
          } else if (t === 'COMMERCIAL_LAND') {
            typeOrConditions.push({ title: /\bcommercial\s*land\b/i });
          } else if (t === 'OFFICE_SPACE') {
            typeOrConditions.push({ title: /\boffice\b/i });
          } else if (t === 'RETAIL_SHOP') {
            typeOrConditions.push({ title: /\b(retail|shop)\b/i });
          } else if (t === 'SHOWROOM' || t === 'SHOP_SHOWROOM') {
            typeOrConditions.push({ title: /\b(showroom|shop)\b/i });
          } else if (t === 'COWORKING_SPACE') {
            typeOrConditions.push({ title: /\b(coworking|co-working)\b/i });
          } else if (t === 'SHOPPING_MALL') {
            typeOrConditions.push({ title: /\b(mall|shopping mall)\b/i });
          } else if (t === 'AGRICULTURAL_LAND') {
            typeOrConditions.push({ title: /\b(farmland|agriculture|agricultural)\b/i });
          } else if (t === 'FARM_HOUSE_LAND') {
            typeOrConditions.push({ title: /\bfarm\s*house\b/i });
          } else if (t === 'RESORT') {
            typeOrConditions.push({ title: /\bresort\b/i });
          } else if (t === 'HOTEL') {
            typeOrConditions.push({ title: /\bhotel\b/i });
          } else if (t === 'SERVICE_APARTMENT') {
            typeOrConditions.push({ title: /\bservice\s*apartment\b/i });
          } else if (t === 'GUEST_HOUSE') {
            typeOrConditions.push({ title: /\bguest\s*house\b/i });
          } else if (t === 'RESIDENTIAL_RENTAL') {
            typeOrConditions.push({ title: /\b(rent|rental)\b/i });
          } else if (t === 'COMMERCIAL_LEASE') {
            typeOrConditions.push({ title: /\b(lease|commercial lease)\b/i });
          } else if (t === 'COLIVING_PG') {
            typeOrConditions.push({ title: /\b(coliving|co-living|paying guest|pg)\b/i });
          } else if (t === 'VACATION_RENTAL_AIRBNB') {
            typeOrConditions.push({ title: /\b(vacation|airbnb|holiday home)\b/i });
          } else if (t === 'WAREHOUSE_LAND') {
            typeOrConditions.push({ title: /\b(warehouse|godown)\b/i });
          } else if (
            t === 'INDUSTRIAL_BUILDING' ||
            t === 'INDUSTRIAL_SHED' ||
            t === 'INDUSTRIAL_PLOT'
          ) {
            typeOrConditions.push({ title: /\bindustrial\b/i });
          }
        }

        andConditions.push({ $or: typeOrConditions });
      }
    }

    /*
     * ------------------------------------------------------------
     * BHK (BEDROOM COUNT)
     * ------------------------------------------------------------
     */

    if (params.bhk && params.bhk.trim()) {
      const bhkList = params.bhk
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);

      const bhkOrConditions: Record<string, any>[] = [];

      for (const b of bhkList) {
        const num = b.match(/\d+/)?.[0];
        if (num) {
          const numRegex = new RegExp(`\\b${num}\\s*(?:bhk|bedroom|bed)\\b`, 'i');
          bhkOrConditions.push(
            { bhk: b },
            { bhk: `${num} BHK` },
            { bhk: `${num} Bhk` },
            { title: numRegex },
            { description: numRegex },
          );
        } else {
          bhkOrConditions.push({ bhk: b });
        }
      }

      if (bhkOrConditions.length > 0) {
        andConditions.push({ $or: bhkOrConditions });
      }
    }

    /*
     * ------------------------------------------------------------
     * LOCATION
     * ------------------------------------------------------------
     */

    if (params.city && params.city.trim() && !params.query) {
      const cityRegex =
        escapeRegex(
          params.city.trim(),
        );

      query['location.city'] = {
        $regex: new RegExp(
          cityRegex,
          'i',
        ),
      };
    }

    if (params.state && params.state !== 'ALL') {
      const stateRegex =
        escapeRegex(
          params.state.trim(),
        );

      query['location.state'] = {
        $regex: new RegExp(
          stateRegex,
          'i',
        ),
      };
    }

    /*
     * ------------------------------------------------------------
     * PRICE
     * ------------------------------------------------------------
     */

    if (
      params.minPrice !== undefined ||
      params.maxPrice !== undefined
    ) {
      const priceQuery: Record<
        string,
        number
      > = {};

      if (
        params.minPrice !==
        undefined
      ) {
        const min =
          Number(params.minPrice);

        if (
          Number.isFinite(min) &&
          min > 0
        ) {
          priceQuery.$gte = min;
        }
      }

      if (
        params.maxPrice !==
        undefined
      ) {
        const max =
          Number(params.maxPrice);

        if (
          Number.isFinite(max) &&
          max > 0
        ) {
          priceQuery.$lte = max;
        }
      }

      if (
        Object.keys(priceQuery)
          .length > 0
      ) {
        query.totalPrice =
          priceQuery;
      }
    }

    /*
     * ------------------------------------------------------------
     * AREA
     * ------------------------------------------------------------
     */

    if (
      params.minArea !== undefined ||
      params.maxArea !== undefined
    ) {
      const areaQuery: Record<
        string,
        number
      > = {};

      if (
        params.minArea !==
        undefined
      ) {
        const min =
          Number(params.minArea);

        if (
          Number.isFinite(min) &&
          min > 0
        ) {
          areaQuery.$gte = min;
        }
      }

      if (
        params.maxArea !==
        undefined
      ) {
        const max =
          Number(params.maxArea);

        if (
          Number.isFinite(max) &&
          max > 0
        ) {
          areaQuery.$lte = max;
        }
      }

      if (
        Object.keys(areaQuery)
          .length > 0
      ) {
        query.landAreaYards =
          areaQuery;
      }
    }

    /*
     * ------------------------------------------------------------
     * DIRECT LANDOWNER ONLY
     * ------------------------------------------------------------
     */

    if (params.verifiedOnly) {
      query.sellerType = 'INDIVIDUAL';
    }

    /*
     * ------------------------------------------------------------
     * TEXT SEARCH QUERY
     * ------------------------------------------------------------
     */

    if (
      params.query?.trim()
    ) {
      const searchRegex =
        new RegExp(
          escapeRegex(
            params.query.trim(),
          ),
          'i',
        );

      andConditions.push({
        $or: [
          {
            title: searchRegex,
          },
          {
            description:
              searchRegex,
          },
          {
            'location.city':
              searchRegex,
          },
          {
            'location.state':
              searchRegex,
          },
          {
            'location.address':
              searchRegex,
          },
          {
            'location.district':
              searchRegex,
          },
          {
            nearbyLandmarks:
              searchRegex,
          },
        ],
      });
    }

    /* Combine compound AND conditions into MongoDB query */
    if (andConditions.length === 1) {
      Object.assign(query, andConditions[0]);
    } else if (andConditions.length > 1) {
      query.$and = andConditions;
    }

    /*
     * ------------------------------------------------------------
     * SORT
     * ------------------------------------------------------------
     */

    const sort: Record<
      string,
      1 | -1
    > = {};

    switch (params.sortBy) {
      case 'price_asc':
        sort.totalPrice = 1;
        break;

      case 'price_desc':
        sort.totalPrice = -1;
        break;

      case 'area_asc':
        sort.landAreaYards = 1;
        break;

      case 'area_desc':
        sort.landAreaYards = -1;
        break;

      case 'newest':
      default:
        sort.createdAt = -1;
        break;
    }

    /*
     * Stable secondary sort.
     */
    sort._id = -1;

    /*
     * ------------------------------------------------------------
     * DATABASE & SUBSCRIPTION EXPIRY SYNC
     * ------------------------------------------------------------
     */

    // Proactively sync properties whose subscriptions have passed expiry
    await syncExpiredProperties();

    const isPublicQuery =
      params.publicOnly !== false &&
      !params.sellerId &&
      !params.isAdmin;

    const findQuery = PropertyModel.find(query);
    if (isPublicQuery) {
      findQuery.select(PUBLIC_PROPERTY_PROJECTION);
    }

    const [
      docs,
      total,
    ] = await Promise.all([
      findQuery
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      PropertyModel.countDocuments(
        query,
      ),
    ]);

    const sanitizedDocs = isPublicQuery
      ? docs.map(toPublicPropertyListItem)
      : (docs as unknown as IProperty[]);

    return {
      data: sanitizedDocs,

      total,

      page,

      totalPages:
        Math.ceil(
          total / limit,
        ) || 1,

      limit,
    };
  } catch (error) {
    console.error(
      'Mongo query error in getProperties:',
      error,
    );

    return {
      data: [],
      total: 0,
      page,
      totalPages: 1,
      limit,
    };
  }
}

/* ================================================================
   GET SINGLE PROPERTY
================================================================ */

export async function getPropertyById(
  id: string,
): Promise<IProperty | null> {
  if (
    !id ||
    !isValidObjectId(id)
  ) {
    return null;
  }

  try {
    const conn =
      await connectToDatabase();

    if (!conn) {
      return null;
    }

    const doc =
      await PropertyModel
        .findById(id)
        .lean();

    if (!doc) {
      return null;
    }

    /*
     * Proactive subscription expiration handling on deep-link fetch (B-5).
     * When a PUBLISHED or EXPIRING_SOON property has passed its subscription expiry date,
     * immediately transition its state to EXPIRED in the database and in the returned object.
     */
    if (
      (doc.listingStatus === 'PUBLISHED' || doc.listingStatus === 'EXPIRING_SOON') &&
      doc.subscriptionExpiresAt &&
      new Date(doc.subscriptionExpiresAt).getTime() <= Date.now()
    ) {
      await PropertyModel.findByIdAndUpdate(id, {
        $set: {
          listingStatus: 'EXPIRED',
          updatedAt: new Date(),
        },
      });
      (doc as any).listingStatus = 'EXPIRED';
    }

    return doc as unknown as IProperty;
  } catch (error) {
    console.error(
      'Error fetching property by ID:',
      error,
    );

    return null;
  }
}

/* ================================================================
   SUBSCRIPTION EXPIRY SYNCHRONIZATION (B-5)
================================================================ */

/**
 * Proactively marks all properties whose subscription has expired as 'EXPIRED'.
 * Transitions both PUBLISHED and EXPIRING_SOON listings whose subscriptionExpiresAt <= now.
 */
export async function syncExpiredProperties(): Promise<{
  matchedCount: number;
  modifiedCount: number;
}> {
  await connectToDatabase();
  const now = new Date();
  const result = await PropertyModel.updateMany(
    {
      listingStatus: { $in: ['PUBLISHED', 'EXPIRING_SOON'] },
      subscriptionExpiresAt: { $lte: now },
    },
    {
      $set: { listingStatus: 'EXPIRED', updatedAt: now },
    }
  );

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
}

/* ================================================================
   CREATE PROPERTY
================================================================ */

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
export async function createProperty(
  data: any,
): Promise<IProperty> {
  const area =
    Number(data.landAreaYards);

  const price =
    Number(data.pricePerYard);

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

  /*
   * Authoritative server calculation.
   */

  const {
    landAreaYards,
    pricePerYard,
    totalPrice,
    publishingFee,
    monthlyListingFee,
  } =
    calculateAuthoritativeFees(
      area,
      price,
    );

  await connectToDatabase();

  /*
   * Duplicate Listing Guard (B-6).
   * Prevents spam or accidental re-submission of identical properties by the same seller.
   */
  if (data.sellerId && data.title && data.location?.pincode) {
    const normalizedTitle = String(data.title).trim();
    const existingDuplicate = await PropertyModel.findOne({
      sellerId: data.sellerId,
      landAreaYards,
      'location.pincode': String(data.location.pincode).trim(),
      listingStatus: { $in: ['DRAFT', 'PAYMENT_PENDING', 'PUBLISHED', 'EXPIRING_SOON'] },
      title: { $regex: new RegExp(`^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    }).lean();

    if (existingDuplicate) {
      throw new DuplicatePropertyError(
        'You already have an active or draft listing with this title, area, and pincode. Please update your existing listing instead of creating a duplicate.',
        String(existingDuplicate._id)
      );
    }
  }

  /*
   * Images.
   */

  const formattedImages =
    (
      data.images || []
    ).map(
      (
        img: any,
        index: number,
      ) => ({
        objectKey:
          img.objectKey,

        secureUrl:
          img.secureUrl,

        fileName:
          img.fileName ||
          'image.jpg',

        mimeType:
          img.mimeType ||
          'image/jpeg',

        size:
          img.size || 0,

        isPrimary:
          img.isPrimary ??
          index === 0,

        sortOrder:
          img.sortOrder ??
          index,
      }),
    );

  /*
   * Documents always start as PENDING.
   */

  const formattedDocs =
    (
      data.documents || []
    ).map(
      (doc: any) => ({
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
      'Landowner',

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

    publishingFee,

    monthlyListingFee,

    /*
     * Subscription does not begin until payment.
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
    propertyAttributes: data.propertyAttributes || {},

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

    approximateLocation:
      Boolean(
        data.approximateLocation,
      ),

    governmentRegistrationId:
      data.governmentRegistrationId ||
      '',

    /*
     * New listings always require verification.
     */

    verificationStatus:
      'PENDING' as const,

    /*
     * Payment comes before publication.
     */

    listingStatus:
      'PAYMENT_PENDING' as const,

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

  return created.toObject() as unknown as IProperty;
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

  /*
   * Always let MongoDB maintain the update timestamp.
   */

  propertyUpdates.updatedAt =
    new Date();

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

  return updated
    ? (updated as unknown as IProperty)
    : null;
}