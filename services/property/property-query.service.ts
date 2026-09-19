import {
  IProperty,
  PropertyFilterParams,
  PaginatedResponse,
} from "@/types/property";
import { PropertyModel } from "@/models/Property";
import { connectToDatabase } from "@/lib/db/mongodb";
import { getRedisClient, isRedisAvailable } from "@/lib/redis";
import {
  hotPropertyCache,
  CACHE_TTL_MS,
  REDIS_CACHE_TTL_SEC,
  getDistributedCacheVersion,
  handleRedisCacheError,
} from "./property-cache";
import {
  PUBLIC_PROPERTY_PROJECTION,
  CARD_PROPERTY_PROJECTION,
  toPublicPropertyListItem,
} from "./property-projections";
import { escapeRegex, isValidObjectId } from "./property-helpers";
import { expandPropertyTypeFilter } from "@/config/constants";

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
          const compatibleTypes = expandPropertyTypeFilter(t);
          typeOrConditions.push({ landType: { $in: compatibleTypes } });
          typeOrConditions.push({ propertyType: { $in: compatibleTypes } });

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
          } else if (t === 'OPEN_PLOT') {
            typeOrConditions.push({ title: /\bopen\s*plot\b/i });
          } else if (t === 'RESIDENTIAL_PLOT') {
            typeOrConditions.push({ title: /\bresidential\s*plot\b/i });
          } else if (t === 'FARMLAND_PLOT') {
            typeOrConditions.push({ title: /\bfarmland\s*plot\b/i });
          } else if (t === 'GATED_COMMUNITY_PLOT') {
            typeOrConditions.push({ title: /\bgated\s*(?:community\s*)?plot\b/i });
          } else if (t === 'COMMERCIAL_LAND') {
            typeOrConditions.push({ title: /\bcommercial\s*land\b/i });
          } else if (t === 'INSTITUTIONAL') {
            typeOrConditions.push({ title: /\binstitutional\s*land\b/i });
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
          } else if (t === 'FARMHOUSE' || t === 'FARM_HOUSE_LAND') {
            typeOrConditions.push({ title: /\bfarm\s*house\b/i });
          } else if (t === 'RESORT') {
            typeOrConditions.push({ title: /\bresort\b/i });
          } else if (t === 'HOTEL') {
            typeOrConditions.push({ title: /\bhotel\b/i });
          } else if (t === 'SERVICE_APARTMENT') {
            typeOrConditions.push({ title: /\bserviced?\s*apartment\b/i });
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
     * TRANSACTION TYPE (SALE / RENT / LEASE)
     * ------------------------------------------------------------
     */

    if (params.transactionType && params.transactionType !== 'ALL') {
      const tx = String(params.transactionType).toUpperCase();
      if (tx === 'RENT') {
        andConditions.push({
          $or: [
            { transactionType: 'RENT' },
            { landType: { $in: ['RESIDENTIAL_RENTAL', 'COLIVING_PG', 'VACATION_RENTAL_AIRBNB'] } },
            { title: /\b(rent|rental|to-let)\b/i },
          ],
        });
      } else if (tx === 'LEASE') {
        andConditions.push({
          $or: [
            { transactionType: 'LEASE' },
            { landType: 'COMMERCIAL_LEASE' },
            { title: /\b(lease|commercial lease)\b/i },
          ],
        });
      } else if (tx === 'SALE') {
        andConditions.push({
          $or: [
            { transactionType: 'SALE' },
            {
              $and: [
                { transactionType: { $nin: ['RENT', 'LEASE'] } },
                { landType: { $nin: ['RESIDENTIAL_RENTAL', 'COLIVING_PG', 'VACATION_RENTAL_AIRBNB', 'COMMERCIAL_LEASE'] } },
              ],
            },
          ],
        });
      }
    }

    /*
     * ------------------------------------------------------------
     * LOCATION (CITY & STATE)
     * ------------------------------------------------------------
     */

    if (params.city && params.city.trim()) {
      const cityRegex = new RegExp(escapeRegex(params.city.trim()), 'i');
      andConditions.push({
        $or: [
          { 'location.city': cityRegex },
          { 'location.state': cityRegex },
          { 'location.district': cityRegex },
          { 'location.address': cityRegex },
          { nearbyLandmarks: cityRegex },
          { title: cityRegex },
        ],
      });
    }

    if (params.state && params.state !== 'ALL') {
      const stateRegex = new RegExp(escapeRegex(params.state.trim()), 'i');
      andConditions.push({
        $or: [
          { 'location.state': stateRegex },
          { 'location.address': stateRegex },
        ],
      });
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
        andConditions.push({
          locationCoordinates: {
            $geoWithin: {
              $centerSphere: [[lng, lat], radians],
            },
          },
        });
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
      const priceQuery: Record<string, number> = {};

      if (params.minPrice !== undefined) {
        const min = Number(params.minPrice);
        if (Number.isFinite(min) && min > 0) {
          priceQuery.$gte = min;
        }
      }

      if (params.maxPrice !== undefined) {
        const max = Number(params.maxPrice);
        if (Number.isFinite(max) && max > 0) {
          priceQuery.$lte = max;
        }
      }

      if (Object.keys(priceQuery).length > 0) {
        andConditions.push({ totalPrice: priceQuery });
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
      const areaQuery: Record<string, number> = {};

      if (params.minArea !== undefined) {
        const min = Number(params.minArea);
        if (Number.isFinite(min) && min > 0) {
          areaQuery.$gte = min;
        }
      }

      if (params.maxArea !== undefined) {
        const max = Number(params.maxArea);
        if (Number.isFinite(max) && max > 0) {
          areaQuery.$lte = max;
        }
      }

      if (Object.keys(areaQuery).length > 0) {
        andConditions.push({ landAreaYards: areaQuery });
      }
    }

    /*
     * ------------------------------------------------------------
     * INDIVIDUAL SELLER FILTER
     * ------------------------------------------------------------
     */

    if (params.verifiedOnly) {
      andConditions.push({ sellerType: 'INDIVIDUAL' });
    }

    /*
     * ------------------------------------------------------------
     * TEXT SEARCH QUERY
     * ------------------------------------------------------------
     */

    if (params.query?.trim()) {
      const trimmedQuery = params.query.trim();
      const isSameAsCity =
        params.city &&
        params.city.trim().toLowerCase() === trimmedQuery.toLowerCase();

      if (!isSameAsCity && trimmedQuery.length >= 2) {
        const searchRegex = new RegExp(escapeRegex(trimmedQuery), 'i');
        andConditions.push({
          $or: [
            { title: searchRegex },
            { 'location.city': searchRegex },
            { 'location.state': searchRegex },
            { 'location.district': searchRegex },
            { 'location.address': searchRegex },
            { nearbyLandmarks: searchRegex },
          ],
        });
      }
    }

    /* Combine compound AND conditions into MongoDB query */
    if (andConditions.length > 0) {
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
