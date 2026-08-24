export type LandType =
  | 'RESIDENTIAL_PLOT'
  | 'COMMERCIAL_LAND'
  | 'AGRICULTURAL_LAND'
  | 'INDUSTRIAL_PLOT'
  | 'FARM_HOUSE_LAND'
  | 'INSTITUTIONAL';

export type VerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'VERIFICATION_REQUIRED';

export type ListingStatus =
  | 'DRAFT'
  | 'PAYMENT_PENDING'
  | 'PENDING_VERIFICATION'
  | 'PUBLISHED'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'PAUSED'
  | 'SOLD'
  | 'REJECTED'
  | 'DELETED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED';

export type SellerType =
  | 'INDIVIDUAL'
  | 'COMPANY'
  | 'AGENT';

export type DocumentType =
  | 'TITLE_DEED'
  | 'KHATA_7_12_CERTIFICATE'
  | 'TAX_RECEIPT'
  | 'ENCUMBRANCE_CERTIFICATE'
  | 'GOVT_SURVEY_RECORD'
  | 'POA_OR_OTHER';

export type DocumentVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED';

/* ================================================================
   PROPERTY IMAGE
================================================================ */

export interface IPropertyImage {
  _id?: string;
  propertyId?: string;

  /**
   * R2 object key.
   * Never expose this directly to an unauthenticated client.
   */
  objectKey: string;

  /**
   * Public CDN/R2 URL for property images.
   */
  secureUrl: string;

  fileName: string;
  mimeType: string;
  size: number;

  isPrimary: boolean;
  sortOrder: number;

  createdAt?: string | Date;
}

/* ================================================================
   PROPERTY DOCUMENT
================================================================ */

export interface IPropertyDocument {
  _id?: string;
  propertyId?: string;
  sellerId?: string;

  documentType: DocumentType;

  /**
   * Private R2 object key.
   * This should NEVER be rendered publicly.
   */
  objectKey: string;

  fileName: string;
  mimeType: string;
  size: number;

  verificationStatus: DocumentVerificationStatus;

  uploadedAt: string | Date;
  reviewedAt?: string | Date;
  reviewedBy?: string;

  rejectionReason?: string;
}

/* ================================================================
   LOCATION
================================================================ */

export interface IPropertyLocation {
  /**
   * Public-facing address.
   *
   * Do not assume this is the exact physical location unless
   * the seller intentionally provided it for public display.
   */
  address: string;

  city: string;
  state: string;
  pincode: string;

  district?: string;
}

/* ================================================================
   PROPERTY
================================================================ */

export interface IProperty {
  _id: string;

  sellerId: string;

  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  sellerType?: SellerType;

  /* --------------------------------------------------------------
     BASIC LISTING INFORMATION
  -------------------------------------------------------------- */

  title: string;
  description: string;

  landAreaYards: number;

  /**
   * Seller's asking price per sq. yard.
   * This is NOT the BhoomiMitra listing subscription price.
   */
  pricePerYard: number;

  /**
   * Seller's total asking price.
   */
  totalPrice: number;

  /**
   * True when seller is open to negotiation.
   */
  priceNegotiable?: boolean;

  /* --------------------------------------------------------------
     BHOOMIMITRA SELLER LISTING FEE
  -------------------------------------------------------------- */

  /**
   * Monthly listing subscription amount.
   *
   * Business rule:
   * landAreaYards × ₹10
   */
  publishingFee: number;

  monthlyListingFee?: number;

  subscriptionStartedAt?: string | Date;
  subscriptionExpiresAt?: string | Date;

  paymentStatus?: PaymentStatus;

  isFeePaid?: boolean;

  /* --------------------------------------------------------------
     LAND CLASSIFICATION
  -------------------------------------------------------------- */

  landType: LandType;

  roadAccess: string;

  nearbyLandmarks: string[];

  /* --------------------------------------------------------------
     LOCATION
  -------------------------------------------------------------- */

  location: IPropertyLocation;

  /**
   * Seller-provided Google Maps share URL.
   *
   * Example:
   * https://maps.app.goo.gl/...
   */
  googleMapsShareLink?: string;

  /**
   * Internal/derived coordinates.
   *
   * Do not expose these blindly in public API responses.
   */
  latitude?: number;
  longitude?: number;

  /**
   * When enabled, exact coordinates should not be publicly exposed.
   */
  approximateLocation?: boolean;

  /* --------------------------------------------------------------
     OPTIONAL GOVERNMENT INFORMATION
  -------------------------------------------------------------- */

  /**
   * Optional seller-provided survey / registration / khata /
   * patta reference.
   *
   * This is NOT mandatory for listing.
   */
  governmentRegistrationId?: string;

  /* --------------------------------------------------------------
     VERIFICATION
  -------------------------------------------------------------- */

  verificationStatus: VerificationStatus;

  verificationReviewedAt?: string | Date;
  verificationReviewedBy?: string;

  rejectionReason?: string;

  /* --------------------------------------------------------------
     LISTING LIFECYCLE
  -------------------------------------------------------------- */

  listingStatus: ListingStatus;

  publishedAt?: string | Date;

  /* --------------------------------------------------------------
     MEDIA
  -------------------------------------------------------------- */

  images: IPropertyImage[];

  /**
   * Documents are private.
   *
   * Do not include them in public marketplace API responses.
   */
  documents?: IPropertyDocument[];

  /* --------------------------------------------------------------
     ANALYTICS
  -------------------------------------------------------------- */

  viewsCount?: number;
  inquiriesCount?: number;

  /* --------------------------------------------------------------
     USER-SPECIFIC STATE
  -------------------------------------------------------------- */

  /**
   * Only meaningful when the authenticated user's favorite
   * relationship has been checked.
   */
  isFavorite?: boolean;

  /* --------------------------------------------------------------
     TIMESTAMPS
  -------------------------------------------------------------- */

  createdAt: string | Date;
  updatedAt: string | Date;
}

/* ================================================================
   PUBLIC PROPERTY VIEW
   ================================================================
   
   Recommended shape for unauthenticated marketplace responses.
   This prevents accidentally exposing private seller/document data.
================================================================ */

export interface IPublicProperty {
  _id: string;

  title: string;
  description?: string;

  landAreaYards: number;

  pricePerYard: number;
  totalPrice: number;

  priceNegotiable?: boolean;

  landType: LandType;

  roadAccess: string;

  nearbyLandmarks: string[];

  location: IPropertyLocation;

  googleMapsShareLink?: string;

  approximateLocation?: boolean;

  verificationStatus: VerificationStatus;

  listingStatus: ListingStatus;

  images: IPropertyImage[];

  publishedAt?: string | Date;

  createdAt: string | Date;
  updatedAt: string | Date;

  viewsCount?: number;

  isFavorite?: boolean;
}

/* ================================================================
   AUTHENTICATED PROPERTY VIEW
================================================================ */

export interface IAuthenticatedProperty
  extends IPublicProperty {
  sellerName?: string;
  sellerType?: SellerType;

  /**
   * Contact information should only be populated when the
   * backend explicitly authorizes the requesting user.
   */
  sellerPhone?: string;
  sellerEmail?: string;

  inquiriesCount?: number;
  documents?: IPropertyDocument[];
  governmentRegistrationId?: string;
  publishingFee?: number;
  monthlyListingFee?: number;
  paymentStatus?: PaymentStatus;
  subscriptionStartedAt?: string | Date;
  subscriptionExpiresAt?: string | Date;
  rejectionReason?: string;
}

/* ================================================================
   PROPERTY FILTERS
================================================================ */

export interface PropertyFilterParams {
  query?: string;

  location?: string;

  city?: string;

  state?: string;

  minPrice?: number;
  maxPrice?: number;

  minArea?: number;
  maxArea?: number;

  minPricePerYard?: number;
  maxPricePerYard?: number;

  landType?: LandType | 'ALL';

  verifiedOnly?: boolean;

  sortBy?:
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'area_asc'
  | 'area_desc';

  page?: number;

  limit?: number;

  sellerId?: string;

  listingStatus?: ListingStatus | 'ALL';

  verificationStatus?:
  | VerificationStatus
  | 'ALL';
}

/* ================================================================
   PAGINATION
================================================================ */

export interface PaginatedResponse<T> {
  data: T[];

  total: number;

  page: number;

  totalPages: number;

  limit: number;
}

/* ================================================================
   PROPERTY API RESPONSE
================================================================ */

export interface PropertyResponse<T = IProperty> {
  data: T;
}

/* ================================================================
   PROPERTY MUTATION RESPONSE
================================================================ */

export interface PropertyMutationResponse {
  success: boolean;

  property?: IProperty;

  message?: string;

  error?: string;
}

/* ================================================================
   PROPERTY STATUS UPDATE
================================================================ */

export interface PropertyStatusUpdatePayload {
  status: ListingStatus;

  reason?: string;
}