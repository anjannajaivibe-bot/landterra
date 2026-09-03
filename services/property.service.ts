import {
  IProperty,
  PropertyFilterParams,
  PaginatedResponse,
} from '@/types/property';

import { PropertyModel } from '@/models/Property';

import { connectToDatabase } from '@/lib/db/mongodb';

import {
  calculateAuthoritativeFees,
} from '@/lib/validation/property';

/* ================================================================
   TYPES
================================================================ */

type PropertyUpdateInput =
  Partial<IProperty> &
  Record<string, unknown>;

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

    if (params.sellerId && params.verificationStatus && params.verificationStatus !== 'ALL') {
      query.verificationStatus = params.verificationStatus;
    }

    /*
     * ------------------------------------------------------------
     * LAND TYPE
     * ------------------------------------------------------------
     */

    if (
      params.landType &&
      params.landType !== 'ALL'
    ) {
      query.landType =
        params.landType;
    }

    /*
     * ------------------------------------------------------------
     * LOCATION
     * ------------------------------------------------------------
     */

    if (params.city) {
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

    if (params.state) {
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
          min >= 0
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
          max >= 0
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
          min >= 0
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
          max >= 0
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
     * TEXT SEARCH
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

      query.$or = [
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
      ];
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
     * DATABASE & LAZY SUBSCRIPTION EXPIRY SYNC
     * ------------------------------------------------------------
     */

    // Lazily sync properties whose subscriptions have passed expiry
    await PropertyModel.updateMany(
      {
        listingStatus: 'PUBLISHED',
        subscriptionExpiresAt: { $lte: new Date() },
      },
      {
        $set: { listingStatus: 'EXPIRED', updatedAt: new Date() },
      }
    );

    const [
      docs,
      total,
    ] = await Promise.all([
      PropertyModel
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      PropertyModel.countDocuments(
        query,
      ),
    ]);

    return {
      data:
        docs as unknown as IProperty[],

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
     * Lazy subscription expiration handling.
     * When a published property has passed its subscription expiry date,
     * safely transition its state to EXPIRED.
     */
    if (
      doc.listingStatus === 'PUBLISHED' &&
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
   CREATE PROPERTY
================================================================ */

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

  return updated as unknown as IProperty;
}

/* ================================================================
   SOFT DELETE PROPERTY
================================================================ */

/**
 * Soft delete.
 *
 * NEVER physically delete marketplace property records.
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