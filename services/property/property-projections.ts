import {
  IProperty,
  IPublicProperty,
  IPropertyImage,
} from "@/types/property";

export const PUBLIC_PROPERTY_PROJECTION = {
  _id: 1,
  title: 1,
  description: 1,
  landAreaYards: 1,
  pricePerYard: 1,
  totalPrice: 1,
  priceNegotiable: 1,
  landType: 1,
  transactionType: 1,
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
  transactionType: 1,
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
    transactionType: (doc.transactionType as any) ||
      (doc.landType === 'RESIDENTIAL_RENTAL' || doc.landType === 'COLIVING_PG' || doc.landType === 'VACATION_RENTAL_AIRBNB'
        ? 'RENT'
        : doc.landType === 'COMMERCIAL_LEASE'
        ? 'LEASE'
        : 'SALE'),
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

export function isObjectIdLike(val: any): boolean {
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
