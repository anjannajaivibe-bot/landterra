import {
  IProperty,
  IPublicProperty,
  IPropertyImage,
  IPropertyDocument,
  PropertyFilterParams,
  PaginatedResponse,
} from '@/types/property';

import { PropertyModel } from '@/models/Property';

import { connectToDatabase } from '@/lib/db/mongodb';

import {
  calculateAuthoritativeFees,
  CreatePropertyInput,
  UpdatePropertyInput,
} from '@/lib/validation/property';

import { deleteFilesFromStorage } from '@/services/upload.service';
import { enqueueAndDispatchExpiringSoonEmail } from '@/services/email.service';
import { createAuditLog } from '@/services/audit.service';
import {
  getRedisClient,
  isUpstashConfigured,
  isRedisAvailable,
  markRedisUnreachable,
} from '@/lib/redis';

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
  latitude: 1,
  longitude: 1,
  locationCoordinates: 1,
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
 * Lightweight MongoDB projection for marketplace property card feeds.
 * Strips heavy non-card data (video, approvals, soilType, waterSource,
 * electricityPhase, propertyAttributes, detailed unit specs, viewsCount)
 * reducing JSON payload size by ~70%.
 */
export const CARD_PROPERTY_PROJECTION = {
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
  roadAccess: 1,
  location: 1,
  verificationStatus: 1,
  listingStatus: 1,
  sellerType: 1,
  'images._id': 1,
  'images.secureUrl': 1,
  'images.isPrimary': 1,
  'images.sortOrder': 1,
  publishedAt: 1,
  createdAt: 1,
} as const;

/* ================================================================
   DISTRIBUTED & IN-MEMORY HOT QUERY CACHE
================================================================ */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const hotPropertyCache = new Map<string, CacheEntry<PaginatedResponse<IProperty>>>();
const CACHE_TTL_MS = 30000; // 30 seconds
const REDIS_CACHE_TTL_SEC = 30;
const REDIS_VERSION_KEY = 'bhoomimitra:props:ver';

/**
 * Local micro-cache of the Redis cache version to avoid extra roundtrips
 */
let localCacheVersion = 1;
let localCacheVersionExpiresAt = 0;

function handleRedisCacheError(err: unknown, action: string): void {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('WRONGPASS') || msg.includes('disabled') || msg.includes('unauthorized')) {
    markRedisUnreachable(15 * 60 * 1000); // 15 minutes cooldown
    console.warn('[property-cache] Upstash Redis credentials invalid or disabled (WRONGPASS). Switched to fast in-memory cache.');
  } else {
    markRedisUnreachable(30 * 1000); // 30s cooldown
    console.warn(`[property-cache] Redis operation failed (${action}):`, msg.slice(0, 100));
  }
}

async function getDistributedCacheVersion(): Promise<number> {
  const now = Date.now();
  if (now < localCacheVersionExpiresAt) {
    return localCacheVersion;
  }
  const redis = getRedisClient();
  if (!redis) return 1;
  try {
    const ver = await redis.get<number>(REDIS_VERSION_KEY);
    if (typeof ver === 'number' && ver > 0) {
      localCacheVersion = ver;
    } else if (ver !== null && !isNaN(Number(ver))) {
      localCacheVersion = Number(ver);
    } else {
      localCacheVersion = 1;
    }
    localCacheVersionExpiresAt = now + 5000; // Micro-cache version locally for 5 seconds
    return localCacheVersion;
  } catch (err) {
    handleRedisCacheError(err, 'retrieve cache version');
    return localCacheVersion;
  }
}

/**
 * Invalidates the hot query cache across both the local node and
 * distributed serverless instances by incrementing the Redis version key.
 */
export function invalidatePropertyCache(): void {
  // 1. Immediately invalidate local in-memory cache
  hotPropertyCache.clear();
  localCacheVersionExpiresAt = 0;

  // 2. Increment distributed Redis version key (O(1) multi-node invalidation)
  if (isRedisAvailable()) {
    const redis = getRedisClient();
    if (redis) {
      redis.incr(REDIS_VERSION_KEY).catch((err) => {
        handleRedisCacheError(err, 'increment cache version');
      });
    }
  }
}

/**
 * Defense-in-depth serializer for public marketplace listing items.
 * Ensures the returned shape strictly adheres to IPublicProperty,
 * strips any inadvertent sensitive or private fields, and converts
 * Mongoose ObjectIds and Date instances to JSON-serializable primitives.
 */
export function toPublicPropertyListItem(
  doc: Record<string, any> | IProperty,
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
    latitude: doc.latitude,
    longitude: doc.longitude,
    locationCoordinates: doc.locationCoordinates,
    approximateLocation: doc.approximateLocation,
    verificationStatus: doc.verificationStatus,
    listingStatus: doc.listingStatus,
    sellerType: doc.sellerType,
    images: Array.isArray(doc.images)
      ? doc.images.map((img: Partial<IPropertyImage>) => ({
          _id: img._id ? String(img._id) : undefined,
          secureUrl: img.secureUrl || '',
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
    publishedAt: doc.publishedAt instanceof Date
      ? doc.publishedAt.toISOString()
      : (doc.publishedAt ? String(doc.publishedAt) : undefined),
    createdAt: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : (doc.createdAt ? String(doc.createdAt) : new Date().toISOString()),
    updatedAt: doc.updatedAt instanceof Date
      ? doc.updatedAt.toISOString()
      : (doc.updatedAt ? String(doc.updatedAt) : new Date().toISOString()),
    viewsCount: doc.viewsCount,
  };

  return publicItem as unknown as IProperty;
}

function isObjectIdLike(val: any): boolean {
  if (!val || typeof val !== 'object') return false;
  return (
    val._bsontype === 'ObjectID' ||
    val._bsontype === 'ObjectId' ||
    typeof val.toHexString === 'function' ||
    val.constructor?.name === 'ObjectId' ||
    val.constructor?.name === 'ObjectID' ||
    (typeof val.toString === 'function' && /^[0-9a-fA-F]{24}$/.test(val.toString()))
  );
}

/**
 * Fast POJO sanitizer for Mongoose documents and objects.
 * Recursively converts ObjectIds to strings and Date instances to ISO strings,
 * producing a pure JSON-serializable plain JavaScript object without
 * the CPU and memory allocation overhead of JSON.parse(JSON.stringify(doc)).
 */
export function toSerializableProperty<T = any>(doc: any): T {
  if (doc === null || doc === undefined) return doc;

  // Primitives
  if (typeof doc !== 'object') return doc;

  // Date objects
  if (doc instanceof Date) {
    return doc.toISOString() as unknown as T;
  }

  // MongoDB ObjectId or BSON type
  if (isObjectIdLike(doc)) {
    return doc.toString() as unknown as T;
  }

  // Arrays
  if (Array.isArray(doc)) {
    return doc.map((item) => toSerializableProperty(item)) as unknown as T;
  }

  // Plain objects & Mongoose lean documents
  const result: Record<string, any> = {};
  for (const key of Object.keys(doc)) {
    const val = doc[key];
    if (val === undefined) continue;
    if (val === null) {
      result[key] = null;
    } else if (val instanceof Date) {
      result[key] = val.toISOString();
    } else if (isObjectIdLike(val)) {
      result[key] = val.toString();
    } else if (Array.isArray(val)) {
      result[key] = val.map((item) => toSerializableProperty(item));
    } else if (typeof val === 'object') {
      result[key] = toSerializableProperty(val);
    } else {
      result[key] = val;
    }
  }

  return result as T;
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
  const isPublicQuery =
    params.publicOnly !== false &&
    !params.sellerId &&
    !params.isAdmin;

  // Check in-memory & distributed Redis cache for public queries (fast path: <1ms response)
  const cacheKey = isPublicQuery ? JSON.stringify(params) : null;
  if (cacheKey) {
    const cached = hotPropertyCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    if (isRedisAvailable()) {
      try {
        const redis = getRedisClient();
        if (redis) {
          const version = await getDistributedCacheVersion();
          const redisKey = `bhoomimitra:props:v${version}:${cacheKey}`;
          const redisData = await redis.get<PaginatedResponse<IProperty>>(redisKey);
          if (redisData && Array.isArray(redisData.data)) {
            hotPropertyCache.set(cacheKey, {
              data: redisData,
              expiresAt: Date.now() + CACHE_TTL_MS,
            });
            return redisData;
          }
        }
      } catch (err) {
        handleRedisCacheError(err, 'read query cache');
      }
    }
  }

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
       * Also filter out listings whose subscription has expired.
       */
      query.listingStatus =
        'PUBLISHED';
      query.subscriptionExpiresAt = { $gt: new Date() };
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
     * GEOSPATIAL SEARCH (RADIUS & PROXIMITY)
     * ------------------------------------------------------------
     */
    let hasNearQuery = false;
    if (
      params.nearLat !== undefined &&
      params.nearLng !== undefined &&
      Number.isFinite(Number(params.nearLat)) &&
      Number.isFinite(Number(params.nearLng))
    ) {
      const lat = Number(params.nearLat);
      const lng = Number(params.nearLng);
      const radiusKm = Number(params.radiusKm) > 0 ? Number(params.radiusKm) : 25;

      // If user requested a custom non-default sort (e.g. price_asc, area_desc),
      // use $geoWithin with $centerSphere to allow compound MongoDB sort.
      if (params.sortBy && params.sortBy !== 'newest') {
        const radians = radiusKm / 6378.1;
        query.locationCoordinates = {
          $geoWithin: {
            $centerSphere: [[lng, lat], radians],
          },
        };
      } else {
        // Proximity search using $near and 2dsphere index (maxDistance in meters)
        query.locationCoordinates = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: radiusKm * 1000,
          },
        };
        hasNearQuery = true;
      }
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
      const trimmedQuery = params.query.trim();

      // Only search when at least 3 characters are entered (Option C)
      if (trimmedQuery.length >= 3) {
        const searchRegex =
          new RegExp(
            escapeRegex(
              trimmedQuery,
            ),
            'i',
          );

        // Targeted search: title, city, state, district, address, nearbyLandmarks
        // EXCLUDES heavy description text to eliminate full collection scans (Option B)
        andConditions.push({
          $or: [
            {
              title: searchRegex,
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
              'location.district':
                searchRegex,
            },
            {
              'location.address':
                searchRegex,
            },
            {
              nearbyLandmarks:
                searchRegex,
            },
          ],
        });
      }
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
     * PROJECTION & QUERY EXECUTION
     * ------------------------------------------------------------
     */

    const findQuery = PropertyModel.find(query);
    if (isPublicQuery) {
      if (params.cardOnly !== false && !params.fullDetails) {
        findQuery.select(CARD_PROPERTY_PROJECTION);
      } else {
        findQuery.select(PUBLIC_PROPERTY_PROJECTION);
      }
    }

    // Execute find query
    const docs = await (hasNearQuery
      ? findQuery
          .skip(skip)
          .limit(limit)
          .lean()
      : findQuery
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean());

    // Short-circuit countDocuments:
    // If page 1 has fewer results than the limit, docs.length IS the exact total count!
    let total: number;
    if (page === 1 && docs.length < limit) {
      total = docs.length;
    } else {
      // MongoDB countDocuments does not allow $near (which is a sorting operator).
      // Use $geoWithin with $centerSphere for the count query.
      const countQuery = { ...query };
      if (hasNearQuery && params.nearLat !== undefined && params.nearLng !== undefined) {
        const lat = Number(params.nearLat);
        const lng = Number(params.nearLng);
        const radiusKm = Number(params.radiusKm) > 0 ? Number(params.radiusKm) : 25;
        countQuery.locationCoordinates = {
          $geoWithin: {
            $centerSphere: [[lng, lat], radiusKm / 6378.1],
          },
        };
      }
      total = await PropertyModel.countDocuments(countQuery);
    }

    const sanitizedDocs = isPublicQuery
      ? docs.map(toPublicPropertyListItem)
      : (docs as unknown as IProperty[]);

    const response: PaginatedResponse<IProperty> = {
      data: sanitizedDocs,
      total,
      page,
      totalPages:
        Math.ceil(
          total / limit,
        ) || 1,
      limit,
    };

    // Store in hot query cache for subsequent visits
    if (cacheKey) {
      hotPropertyCache.set(cacheKey, {
        data: response,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      if (isRedisAvailable()) {
        const redis = getRedisClient();
        if (redis) {
          getDistributedCacheVersion().then((version) => {
            const redisKey = `bhoomimitra:props:v${version}:${cacheKey}`;
            redis.set(redisKey, response, { ex: REDIS_CACHE_TTL_SEC }).catch((err) => {
              handleRedisCacheError(err, 'write query cache');
            });
          }).catch((err) => {
            handleRedisCacheError(err, 'retrieve version for query cache');
          });
        }
      }
    }

    return response;
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
   CREATE PROPERTY
================================================================ */

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

export class SpamContentValidationError extends Error {
  public status = 400;

  constructor(message = 'Listing content contains prohibited terms or suspicious claims.') {
    super(message);
    this.name = 'SpamContentValidationError';
  }
}

export interface SpamScanResult {
  isBlocked: boolean;
  isSuspicious: boolean;
  blockedReason?: string;
  flaggedTerms: string[];
}

/**
 * Automated Pre-Submission Spam & Scam Keyword Filter
 * Scans title and description for fraudulent promises, advance payment solicitations,
 * fake document claims, and suspicious URL shorteners / off-platform chat links.
 */
export function scanListingContentForSpam(title = '', description = ''): SpamScanResult {
  const fullText = `${title || ''} ${description || ''}`.toLowerCase();

  // 1. Severe fraudulent / illegal claims that immediately block submission
  const BLOCKED_FRAUD_PATTERNS = [
    { pattern: /\bfake\s+deed\b/i, label: 'Fake Deed claims' },
    { pattern: /\b(disputed\s+land|kabja\s+land|illegal\s+possession)\b/i, label: 'Disputed or illegal possession land' },
    { pattern: /\b(advance\s+(money|payment|token)\s+before\s+(visit|seeing|site))\b/i, label: 'Advance payment solicitation before site visit' },
    { pattern: /\b(transfer\s+(advance|money)\s+to\s+(gpay|phonepe|paytm)\s+before\s+visit)\b/i, label: 'Off-platform advance payment demand' },
    { pattern: /\b(double\s+your\s+money|triple\s+your\s+money|100%\s+guaranteed\s+profit)\b/i, label: 'Unrealistic speculative financial guarantee' },
    { pattern: /\b(ponzi|money\s+doubling\s+scheme)\b/i, label: 'Financial fraud schemes' },
  ];

  for (const item of BLOCKED_FRAUD_PATTERNS) {
    if (item.pattern.test(fullText)) {
      return {
        isBlocked: true,
        isSuspicious: true,
        blockedReason: `Listing content contains prohibited terms: "${item.label}". BhoomiMitra strictly prohibits fraudulent promises, off-platform advance payment demands, and disputed properties.`,
        flaggedTerms: [item.label],
      };
    }
  }

  // 2. Suspicious terms and URL heuristics that flag the listing for mandatory manual admin review
  const SUSPICIOUS_TERMS_PATTERNS = [
    { pattern: /\bguaranteed\s+(return|returns|profit|income)\b/i, term: 'guaranteed returns' },
    { pattern: /\b(100%\s+return|risk\s+free\s+investment)\b/i, term: 'risk free investment' },
    { pattern: /\bwithout\s+documents\b/i, term: 'without documents' },
    { pattern: /\bno\s+documents\s+needed\b/i, term: 'no documents needed' },
    { pattern: /\b(earn\s+daily|earn\s+per\s+day)\b/i, term: 'daily earning claims' },
    { pattern: /\b(bitcoin|crypto|usdt|ethereum)\b/i, term: 'cryptocurrency solicitation' },
    { pattern: /(https?:\/\/)?(t\.me|telegram\.me)\/[a-zA-Z0-9_+]+/i, term: 'telegram channel link' },
    { pattern: /(https?:\/\/)?(bit\.ly|tinyurl\.com|cutt\.ly|is\.gd)\/[a-zA-Z0-9_-]+/i, term: 'url shortener link' },
  ];

  const flaggedTerms: string[] = [];
  for (const item of SUSPICIOUS_TERMS_PATTERNS) {
    if (item.pattern.test(fullText)) {
      flaggedTerms.push(item.term);
    }
  }

  return {
    isBlocked: false,
    isSuspicious: flaggedTerms.length > 0,
    flaggedTerms,
  };
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
  data: CreatePropertyInput,
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
   * ------------------------------------------------------------
   * SELLER LISTING LIMIT & CONTENT-LEVEL DUPLICATE GUARD (B-6)
   * ------------------------------------------------------------
   * 1. Strictly scoped to the SAME seller: matched across sellerId,
   *    sellerEmail, or phone number to prevent multi-account evasion.
   *    Different users listing properties in the same area/pincode
   *    are NEVER blocked.
   * 2. Limit: A seller may have at most 2 active listings
   *    (DRAFT, PAYMENT_PENDING, PUBLISHED, or EXPIRING_SOON).
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
      listingStatus: { $in: ['DRAFT', 'PAYMENT_PENDING', 'PUBLISHED', 'EXPIRING_SOON'] },
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