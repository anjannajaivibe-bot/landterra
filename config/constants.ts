/* ================================================================
   BHOOMIMITRA CONFIGURATION
================================================================ */

/* ================================================================
   LISTING SUBSCRIPTION
================================================================ */

/**
 * BhoomiMitra seller listing subscription:
 *
 * Flat listing publishing fee for 30 days.
 *
 * IMPORTANT:
 * This is NOT the seller's property asking price.
 */
export const LISTING_PRICE_PER_SQ_YARD_PER_MONTH = 10;

export const LISTING_SUBSCRIPTION_DURATION_DAYS = 30;

/* ================================================================
   SITE CONFIGURATION
================================================================ */

export const SITE_CONFIG = {
  name: 'BhoomiMitra',

  tagline: 'Find Land With More Confidence',

  description:
    'Discover land and plots across India, compare properties, review listing information, and connect directly with sellers.',

  url:
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://bhoomimitra.com',

  currencySymbol: '₹',

  currencyLocale: 'en-IN',

  /* --------------------------------------------------------------
     SELLER LISTING FEE
  -------------------------------------------------------------- */

  listingPricePerSqYardPerMonth:
    LISTING_PRICE_PER_SQ_YARD_PER_MONTH,

  publishingFeeRatePerYard:
    LISTING_PRICE_PER_SQ_YARD_PER_MONTH,

  subscriptionDurationDays:
    LISTING_SUBSCRIPTION_DURATION_DAYS,

  /* --------------------------------------------------------------
     LAND AREA
  -------------------------------------------------------------- */

  minLandAreaYards: 50,

  maxLandAreaYards: 500000,

  /* --------------------------------------------------------------
     ASKING PRICE
  -------------------------------------------------------------- */

  minPricePerYard: 100,

  maxPricePerYard: 10000000,

  /* --------------------------------------------------------------
     SUPPORT
  -------------------------------------------------------------- */

  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    'support@bhoomimitra.com',

  contactPhone:
    process.env.NEXT_PUBLIC_CONTACT_PHONE ||
    '+91 800 555 0199',
} as const;

/* ================================================================
   LAND TYPES
================================================================ */

export const LAND_TYPES = [
  {
    value: 'RESIDENTIAL_PLOT',
    label: 'Residential Plot',
    shortLabel: 'Residential',
    description:
      'Plots intended for homes, villas, layouts and residential development.',
  },

  {
    value: 'COMMERCIAL_LAND',
    label: 'Commercial Land',
    shortLabel: 'Commercial',
    description:
      'Land suitable for shops, offices, hotels, retail and commercial development.',
  },

  {
    value: 'AGRICULTURAL_LAND',
    label: 'Agricultural / Farmland',
    shortLabel: 'Agricultural',
    description:
      'Cultivable farmland, plantations, orchards and agricultural properties.',
  },

  {
    value: 'FARM_HOUSE_LAND',
    label: 'Farm House / Weekend Land',
    shortLabel: 'Farm House',
    description:
      'Land intended for farm houses, retreats and weekend properties.',
  },

  {
    value: 'INDUSTRIAL_PLOT',
    label: 'Industrial / Warehouse Land',
    shortLabel: 'Industrial',
    description:
      'Land suitable for factories, warehouses, logistics and industrial use.',
  },

  {
    value: 'INSTITUTIONAL',
    label: 'Institutional Land',
    shortLabel: 'Institutional',
    description:
      'Land intended for schools, hospitals, institutions and similar uses.',
  },
] as const;

/* ================================================================
   DOCUMENT TYPES
================================================================ */

export const DOCUMENT_TYPES = [
  {
    value: 'TITLE_DEED',
    label: 'Registered Title Deed / Sale Deed',
    required: true,
  },

  {
    value: 'KHATA_7_12_CERTIFICATE',
    label: 'Khata / 7/12 Extract / Patta Passbook',
    required: true,
  },

  {
    value: 'TAX_RECEIPT',
    label: 'Latest Property Tax Receipt',
    required: true,
  },

  {
    value: 'ENCUMBRANCE_CERTIFICATE',
    label: 'Encumbrance Certificate',
    required: false,
  },

  {
    value: 'GOVT_SURVEY_RECORD',
    label: 'Government Survey Map / FMB Sketch',
    required: false,
  },

  {
    value: 'POA_OR_OTHER',
    label: 'Power of Attorney / Layout / Supporting Document',
    required: false,
  },
] as const;

/* ================================================================
   VERIFICATION BADGES
================================================================ */

export const VERIFICATION_BADGES = {
  VERIFIED: {
    label: 'Direct Classified',

    color: 'saffron',

    badgeClass:
      'bg-[#fff1dc] text-[#c75e0a] border-[#FF9933]/40',

    description:
      'Direct peer-to-peer listing published directly by the landowner.',
  },

  PENDING: {
    label: 'Draft',

    color: 'amber',

    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200',

    description:
      'Listing draft awaiting publishing fee completion.',
  },

  VERIFICATION_REQUIRED: {
    label: 'Information Needed',

    color: 'blue',

    badgeClass:
      'bg-blue-50 text-blue-700 border-blue-200',

    description:
      'Additional property information requested from the seller.',
  },

  REJECTED: {
    label: 'Suspended',

    color: 'rose',

    badgeClass:
      'bg-rose-50 text-rose-700 border-rose-200',

    description:
      'Listing has been suspended or deactivated by moderation.',
  },
} as const;

/* ================================================================
   INDIAN STATES
================================================================ */

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Telangana',
  'Karnataka',
  'Maharashtra',
  'Tamil Nadu',
  'Gujarat',
  'Rajasthan',
  'Uttar Pradesh',
  'Haryana',
  'Punjab',
  'Madhya Pradesh',
  'Kerala',
  'Goa',
  'Odisha',
  'West Bengal',
  'Delhi NCR',
  'Uttarakhand',
  'Himachal Pradesh',
] as const;

/* ================================================================
   SORT OPTIONS
================================================================ */

export const PROPERTY_SORT_OPTIONS = [
  {
    value: 'newest',
    label: 'Newest listings',
  },

  {
    value: 'price_asc',
    label: 'Price: Low to High',
  },

  {
    value: 'price_desc',
    label: 'Price: High to Low',
  },

  {
    value: 'area_asc',
    label: 'Area: Small to Large',
  },

  {
    value: 'area_desc',
    label: 'Area: Large to Small',
  },
] as const;

/* ================================================================
   PROPERTY LISTING STATES
================================================================ */

export const PUBLIC_LISTING_STATUSES = [
  'PUBLISHED',
  'EXPIRING_SOON',
] as const;

/**
 * Only these states should normally appear in the public
 * marketplace.
 *
 * DRAFT, PAYMENT_PENDING, PENDING_VERIFICATION, PAUSED,
 * EXPIRED, SOLD, REJECTED and DELETED should not appear
 * as normal purchasable listings.
 */
export const MARKETPLACE_LISTING_STATUSES = [
  'PUBLISHED',
  'EXPIRING_SOON',
] as const;

/* ================================================================
   PUBLIC VERIFICATION STATES
================================================================ */

export const PUBLIC_VERIFICATION_STATUSES = [
  'VERIFIED',
  'PENDING',
  'VERIFICATION_REQUIRED',
  'REJECTED',
] as const;

/* ================================================================
   CUSTOMER EXPERIENCE
================================================================ */

/**
 * Visitors should be able to discover properties without an
 * account.
 */
export const MARKETPLACE_REQUIRES_LOGIN = false;

/**
 * Authentication is progressive.
 *
 * User may browse first.
 * Login happens when protected information or an action requires it.
 */
export const PROPERTY_DETAILS_REQUIRES_LOGIN = true;

/**
 * Google authentication is the primary customer authentication
 * mechanism when enabled in admin settings.
 */
export const DEFAULT_REQUIRE_GOOGLE_LOGIN = true;

/**
 * Phone OTP is required for seller listing when enabled.
 */
export const DEFAULT_REQUIRE_PHONE_OTP = true;

/* ================================================================
   LISTING LIMITS
================================================================ */

export const LISTING_LIMITS = {
  minImages: 1,

  maxImages: 20,

  maxImageSizeMB: 10,

  maxDocuments: 20,

  maxDocumentSizeMB: 25,

  titleMinLength: 10,

  titleMaxLength: 150,

  descriptionMinLength: 30,

  descriptionMaxLength: 5000,
} as const;

/* ================================================================
   URL VALIDATION
================================================================ */

export const GOOGLE_MAPS_URL_PATTERN =
  /^https?:\/\/(?:www\.)?(?:maps\.app\.goo\.gl|google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)(?:\/.*)?$/i;

/* ================================================================
   LEGAL / CUSTOMER DISCLAIMER
================================================================ */

export const LEGAL_DISCLAIMER =
  'BhoomiMitra facilitates property discovery, listing management, confidential document review and direct communication between sellers and prospective buyers. A BhoomiMitra verification status does not constitute a guarantee of title, ownership, legality, valuation or suitability. Buyers should conduct independent legal, title, registration and physical due diligence before entering into any transaction.';

/* ================================================================
   BUYER SAFETY MESSAGE
================================================================ */

export const BUYER_SAFETY_MESSAGE =
  'Never send money, OTPs, passwords or sensitive account information directly to another user. Use the BhoomiMitra platform for property inquiries and verify the property independently before making any payment or commitment.';

/* ================================================================
   SELLER FEE EXPLANATION
================================================================ */

export const SELLER_LISTING_FEE_DESCRIPTION =
  `BhoomiMitra charges sellers only a flat digital advertising and publishing fee for each 30-day property listing period. This fee is solely for publishing and maintaining the advertisement on BhoomiMitra. BhoomiMitra does not collect property purchase payments, booking amounts, token amounts, registration charges or sale consideration. The listing fee is completely separate from the seller's property asking price.`;

/* ================================================================
   VERIFICATION EXPLANATION
================================================================ */

export const VERIFICATION_EXPLANATION = {
  VERIFIED:
    'This listing has completed BhoomiMitra’s internal document review process.',

  PENDING:
    'This listing has been submitted and is currently under review.',

  VERIFICATION_REQUIRED:
    'Additional information or documentation may be required.',

  REJECTED:
    'This listing is not currently marked as verified.',
} as const;
