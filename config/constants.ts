/* ================================================================
   BHOOMIMITRA CONFIGURATION
================================================================ */

/* ================================================================
   LEGACY LISTING-FEE COMPATIBILITY
================================================================ */

/**
 * New BhoomiMitra listings are currently free to publish.
 * These exports are retained temporarily so older code and stored records
 * can be migrated without reintroducing a paid-listing requirement.
 */
export const LISTING_PRICE_PER_SQ_YARD_PER_MONTH = 0;

export const LISTING_SUBSCRIPTION_DURATION_DAYS = 30;

/* ================================================================
   SITE CONFIGURATION
================================================================ */

export const SITE_CONFIG = {
  name: 'BhoomiMitra',

  tagline: 'Find Property With More Confidence',

  description:
    'Explore properties for sale, rent and lease across India, including plots, homes, commercial spaces and hospitality properties. Contact the listed seller directly while BhoomiMitra charges no platform brokerage.',

  url:
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://bhoomimitra.com',

  currencySymbol: '₹',

  currencyLocale: 'en-IN',

  /* --------------------------------------------------------------
     LEGACY LISTING-FEE COMPATIBILITY
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
   PROPERTY TAXONOMY
================================================================ */

/**
 * Canonical property types shown to users.
 *
 * Transaction type (SALE / RENT / LEASE) is deliberately separate
 * from property type. Legacy IDs remain supported in validation and
 * search for backward compatibility, but are not shown as choices.
 */
export const LAND_TYPES = [
  // 1. Land & Plots
  {
    value: 'RESIDENTIAL_PLOT',
    category: 'Land & Plots',
    label: 'Residential Plots',
    shortLabel: 'Residential Plot',
    description: 'Residential plots intended for houses, villas and approved layouts.',
  },
  {
    value: 'FARMLAND_PLOT',
    category: 'Land & Plots',
    label: 'Farm Plots',
    shortLabel: 'Farm Plot',
    description: 'Managed farm plots, plantation plots and agro-community plots.',
  },
  {
    value: 'AGRICULTURAL_LAND',
    category: 'Land & Plots',
    label: 'Agricultural Land',
    shortLabel: 'Agricultural Land',
    description: 'Cultivable farmland, orchards, plantations and agricultural acreage.',
  },
  {
    value: 'COMMERCIAL_LAND',
    category: 'Land & Plots',
    label: 'Commercial Land',
    shortLabel: 'Commercial Land',
    description: 'Land intended for commercial, retail or mixed-use development.',
  },
  {
    value: 'INDUSTRIAL_PLOT',
    category: 'Land & Plots',
    label: 'Industrial Plots',
    shortLabel: 'Industrial Plot',
    description: 'Plots intended for factories, workshops and industrial development.',
  },
  {
    value: 'INSTITUTIONAL',
    category: 'Land & Plots',
    label: 'Institutional Land',
    shortLabel: 'Institutional Land',
    description: 'Land intended for schools, hospitals, institutions and similar uses.',
  },

  // 2. Residential
  {
    value: 'FLAT',
    category: 'Residential',
    label: 'Flats / Apartments',
    shortLabel: 'Flat / Apartment',
    description: 'Apartments, flats and multi-storey residential units.',
  },
  {
    value: 'INDEPENDENT_HOUSE',
    category: 'Residential',
    label: 'Independent Houses',
    shortLabel: 'Independent House',
    description: 'Standalone houses and independent residential homes.',
  },
  {
    value: 'VILLA',
    category: 'Residential',
    label: 'Villas',
    shortLabel: 'Villa',
    description: 'Standalone and gated-community villas.',
  },
  {
    value: 'TOWNHOUSE',
    category: 'Residential',
    label: 'Townhouses',
    shortLabel: 'Townhouse',
    description: 'Attached multi-floor townhouses and row houses.',
  },
  {
    value: 'DUPLEX',
    category: 'Residential',
    label: 'Duplexes',
    shortLabel: 'Duplex',
    description: 'Two-level residential homes with internal connectivity.',
  },
  {
    value: 'PENTHOUSE',
    category: 'Residential',
    label: 'Penthouses',
    shortLabel: 'Penthouse',
    description: 'Top-floor premium residences, often with private terraces.',
  },
  {
    value: 'FARMHOUSE',
    category: 'Residential',
    label: 'Farmhouses',
    shortLabel: 'Farmhouse',
    description: 'Residential farmhouses, countryside homes and retreat residences.',
  },

  // 3. Commercial
  {
    value: 'RETAIL_SHOP',
    category: 'Commercial',
    label: 'Retail Shops',
    shortLabel: 'Retail Shop',
    description: 'High-street shops, market shops and retail units.',
  },
  {
    value: 'SHOWROOM',
    category: 'Commercial',
    label: 'Showrooms',
    shortLabel: 'Showroom',
    description: 'Large-frontage retail and display spaces.',
  },
  {
    value: 'OFFICE_SPACE',
    category: 'Commercial',
    label: 'Office Spaces',
    shortLabel: 'Office Space',
    description: 'Commercial offices, corporate workspaces and business centres.',
  },
  {
    value: 'COWORKING_SPACE',
    category: 'Commercial',
    label: 'Co-working Spaces',
    shortLabel: 'Co-working Space',
    description: 'Shared flexible workspaces, hot desks and managed offices.',
  },
  {
    value: 'SHOPPING_MALL',
    category: 'Commercial',
    label: 'Shopping Malls',
    shortLabel: 'Shopping Mall',
    description: 'Shopping malls and larger retail complexes.',
  },
  {
    value: 'WAREHOUSE_LAND',
    category: 'Commercial',
    label: 'Warehouses / Godowns',
    shortLabel: 'Warehouse / Godown',
    description: 'Warehouses, godowns, logistics hubs and storage facilities.',
  },
  {
    value: 'INDUSTRIAL_BUILDING',
    category: 'Commercial',
    label: 'Industrial Buildings',
    shortLabel: 'Industrial Building',
    description: 'Manufacturing facilities and industrial structures.',
  },
  {
    value: 'INDUSTRIAL_SHED',
    category: 'Commercial',
    label: 'Industrial Sheds',
    shortLabel: 'Industrial Shed',
    description: 'Covered industrial sheds, workshops and production spaces.',
  },

  // 4. Hospitality
  {
    value: 'HOTEL',
    category: 'Hospitality',
    label: 'Hotels',
    shortLabel: 'Hotel',
    description: 'Hotels, boutique hotels and lodging properties.',
  },
  {
    value: 'RESORT',
    category: 'Hospitality',
    label: 'Resorts',
    shortLabel: 'Resort',
    description: 'Leisure resorts, wellness retreats and destination properties.',
  },
  {
    value: 'SERVICE_APARTMENT',
    category: 'Hospitality',
    label: 'Serviced Apartments',
    shortLabel: 'Serviced Apartment',
    description: 'Furnished serviced apartments for short or extended stays.',
  },
  {
    value: 'GUEST_HOUSE',
    category: 'Hospitality',
    label: 'Guest Houses',
    shortLabel: 'Guest House',
    description: 'Guest houses, corporate stays and similar lodging properties.',
  },
] as const;

export type CanonicalPropertyCategory =
  | 'Land & Plots'
  | 'Residential'
  | 'Commercial'
  | 'Hospitality';

export interface CanonicalPropertyType {
  id: string;
  value: string;
  label: string;
  shortLabel: string;
  category: CanonicalPropertyCategory;
  description: string;
}

export const CANONICAL_PROPERTY_TYPES: CanonicalPropertyType[] = LAND_TYPES.map((type) => ({
  id: type.value,
  value: type.value,
  label: type.label,
  shortLabel: type.shortLabel,
  category: type.category,
  description: type.description,
}));

export const CANONICAL_PROPERTY_TYPE_IDS =
  CANONICAL_PROPERTY_TYPES.map((type) => type.id);

/**
 * Legacy IDs are accepted only so older listings and old links remain usable.
 * They must never be shown as duplicate choices in the current listing UI.
 */
export const LEGACY_PROPERTY_TYPE_MAP: Record<string, string> = {
  OPEN_PLOT: 'RESIDENTIAL_PLOT',
  GATED_COMMUNITY_PLOT: 'RESIDENTIAL_PLOT',
  HOUSE_VILLA: 'VILLA',
  SHOP_SHOWROOM: 'SHOWROOM',
  FARM_HOUSE_LAND: 'FARMHOUSE',
  RESIDENTIAL_RENTAL: 'FLAT',
  COMMERCIAL_LEASE: 'OFFICE_SPACE',
  COLIVING_PG: 'FLAT',
  VACATION_RENTAL_AIRBNB: 'RESORT',
};

export function normalizePropertyTypeId(value?: string | null): string {
  if (!value) return '';
  const normalized = value.trim().toUpperCase();
  return LEGACY_PROPERTY_TYPE_MAP[normalized] || normalized;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  ...Object.fromEntries(
    CANONICAL_PROPERTY_TYPES.map((type) => [type.id, type.shortLabel]),
  ),
  OPEN_PLOT: 'Residential Plot',
  GATED_COMMUNITY_PLOT: 'Residential Plot',
  HOUSE_VILLA: 'Villa / Independent House',
  SHOP_SHOWROOM: 'Shop / Showroom',
  FARM_HOUSE_LAND: 'Farmhouse',
  RESIDENTIAL_RENTAL: 'Residential Property',
  COMMERCIAL_LEASE: 'Commercial Property',
  COLIVING_PG: 'Flat / Apartment',
  VACATION_RENTAL_AIRBNB: 'Resort / Holiday Property',
};

export function getPropertyTypeLabel(value?: string | null): string {
  if (!value) return 'Property';
  return PROPERTY_TYPE_LABELS[value.trim().toUpperCase()] || 'Property';
}

/**
 * Canonical filters also match historical duplicate IDs so old listings
 * remain discoverable after the UI taxonomy is cleaned up.
 */
const PROPERTY_TYPE_FILTER_ALIASES: Record<string, string[]> = {
  RESIDENTIAL_PLOT: ['RESIDENTIAL_PLOT', 'OPEN_PLOT', 'GATED_COMMUNITY_PLOT'],
  VILLA: ['VILLA', 'HOUSE_VILLA'],
  INDEPENDENT_HOUSE: ['INDEPENDENT_HOUSE', 'HOUSE_VILLA'],
  RETAIL_SHOP: ['RETAIL_SHOP', 'SHOP_SHOWROOM'],
  SHOWROOM: ['SHOWROOM', 'SHOP_SHOWROOM'],
  FARMHOUSE: ['FARMHOUSE', 'FARM_HOUSE_LAND'],
  FLAT: ['FLAT', 'RESIDENTIAL_RENTAL', 'COLIVING_PG'],
  OFFICE_SPACE: ['OFFICE_SPACE', 'COMMERCIAL_LEASE'],
  RESORT: ['RESORT', 'VACATION_RENTAL_AIRBNB'],
};

export function expandPropertyTypeFilter(value: string): string[] {
  const normalized = value.trim().toUpperCase();
  return PROPERTY_TYPE_FILTER_ALIASES[normalized] || [normalized];
}

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
    label: 'Reviewed',

    color: 'saffron',

    badgeClass:
      'bg-[#fff1dc] text-[#c75e0a] border-[#FF9933]/40',

    description:
      'This listing has completed BhoomiMitra’s internal review process.',
  },

  PENDING: {
    label: 'Under Review',

    color: 'amber',

    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200',

    description:
      'This listing has been submitted and is awaiting platform review.',
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
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi NCR',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
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
] as const;

/**
 * Only these states should normally appear in the public
 * marketplace.
 *
 * DRAFT, legacy PAYMENT_PENDING, PENDING_VERIFICATION, PAUSED,
 * legacy EXPIRING_SOON, EXPIRED, SOLD, REJECTED and DELETED should not
 * appear as normal marketplace-visible listings.
 */
export const MARKETPLACE_LISTING_STATUSES = [
  'PUBLISHED',
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
   LISTING FEE EXPLANATION
================================================================ */

export const SELLER_LISTING_FEE_DESCRIPTION =
  `BhoomiMitra currently allows property listings to be published without a platform listing fee. BhoomiMitra does not collect property purchase payments, booking amounts, token amounts, registration charges, rent, deposits or sale consideration through the marketplace.`;

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
