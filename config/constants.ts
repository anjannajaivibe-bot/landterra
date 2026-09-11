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

  tagline: 'Find Property With More Confidence',

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
  // 1. Land & Plots
  {
    value: 'OPEN_PLOT',
    category: 'Land & Plots',
    label: 'Open Plots',
    shortLabel: 'Open Plot',
    description: 'Open plots and layouts for individual home or boundary development.',
  },
  {
    value: 'FARMLAND_PLOT',
    category: 'Land & Plots',
    label: 'Farmland Plots',
    shortLabel: 'Farmland Plot',
    description: 'Managed farmland plots, managed agro-communities and plantation plots.',
  },
  {
    value: 'GATED_COMMUNITY_PLOT',
    category: 'Land & Plots',
    label: 'Gated Community Plots',
    shortLabel: 'Gated Plot',
    description: 'Plots inside sanctioned, secured gated community developments.',
  },
  {
    value: 'AGRICULTURAL_LAND',
    category: 'Land & Plots',
    label: 'Agricultural Land',
    shortLabel: 'Agricultural',
    description: 'Cultivable farmland, plantations, orchards and agricultural acreage.',
  },
  {
    value: 'RESIDENTIAL_PLOT',
    category: 'Land & Plots',
    label: 'Residential Plot',
    shortLabel: 'Residential Plot',
    description: 'Plots intended for homes, villas, layouts and residential development.',
  },
  {
    value: 'COMMERCIAL_LAND',
    category: 'Land & Plots',
    label: 'Commercial Land',
    shortLabel: 'Commercial Land',
    description: 'Land suitable for commercial complexes, retail and mixed-use development.',
  },
  {
    value: 'INDUSTRIAL_PLOT',
    category: 'Land & Plots',
    label: 'Industrial Plot',
    shortLabel: 'Industrial Plot',
    description: 'Land suitable for factories, workshops, and industrial development.',
  },

  // 2. Residential Units
  {
    value: 'FLAT',
    category: 'Residential Units',
    label: 'Flats / Apartments',
    shortLabel: 'Flat',
    description: 'Residential apartments, builder floors and multi-storey flats.',
  },
  {
    value: 'INDEPENDENT_HOUSE',
    category: 'Residential Units',
    label: 'Independent Houses',
    shortLabel: 'House',
    description: 'Standalone houses and independent residential bungalows.',
  },
  {
    value: 'VILLA',
    category: 'Residential Units',
    label: 'Villas',
    shortLabel: 'Villa',
    description: 'Luxury standalone and gated community villas.',
  },
  {
    value: 'HOUSE_VILLA',
    category: 'Residential Units',
    label: 'House / Villa',
    shortLabel: 'House/Villa',
    description: 'Independent houses, gated community villas and duplex homes.',
  },
  {
    value: 'TOWNHOUSE',
    category: 'Residential Units',
    label: 'Townhouses',
    shortLabel: 'Townhouse',
    description: 'Multi-floor attached townhouses and row houses.',
  },
  {
    value: 'DUPLEX',
    category: 'Residential Units',
    label: 'Duplexes',
    shortLabel: 'Duplex',
    description: 'Two-floor duplex homes and pent-duplex units.',
  },
  {
    value: 'PENTHOUSE',
    category: 'Residential Units',
    label: 'Penthouses',
    shortLabel: 'Penthouse',
    description: 'Top-floor luxury penthouses with private terraces.',
  },

  // 3. Commercial & Retail
  {
    value: 'RETAIL_SHOP',
    category: 'Commercial & Retail',
    label: 'Retail Shops',
    shortLabel: 'Retail Shop',
    description: 'High-street retail stores, market shops, and commercial units.',
  },
  {
    value: 'SHOWROOM',
    category: 'Commercial & Retail',
    label: 'Showrooms',
    shortLabel: 'Showroom',
    description: 'Large frontage retail showrooms for brands, automobiles, and luxury.',
  },
  {
    value: 'SHOP_SHOWROOM',
    category: 'Commercial & Retail',
    label: 'Shop / Showroom',
    shortLabel: 'Shop/Showroom',
    description: 'Retail shops, commercial stores, showrooms and kiosks.',
  },
  {
    value: 'OFFICE_SPACE',
    category: 'Commercial & Retail',
    label: 'Office Spaces',
    shortLabel: 'Office Space',
    description: 'Commercial office spaces, tech parks, and corporate centres.',
  },
  {
    value: 'COWORKING_SPACE',
    category: 'Commercial & Retail',
    label: 'Co-working Spaces',
    shortLabel: 'Co-working',
    description: 'Shared flexible workspaces, hot desks, and managed offices.',
  },
  {
    value: 'SHOPPING_MALL',
    category: 'Commercial & Retail',
    label: 'Shopping Malls',
    shortLabel: 'Mall Unit',
    description: 'Anchor stores, vanity outlets, and retail spaces inside shopping malls.',
  },
  {
    value: 'WAREHOUSE_LAND',
    category: 'Commercial & Retail',
    label: 'Warehouses / Godowns',
    shortLabel: 'Warehouse',
    description: 'Logistics warehouses, storage units, supply hubs, and godowns.',
  },
  {
    value: 'INDUSTRIAL_BUILDING',
    category: 'Commercial & Retail',
    label: 'Industrial Building',
    shortLabel: 'Industrial Building',
    description: 'Manufacturing facilities and industrial structures.',
  },
  {
    value: 'INDUSTRIAL_SHED',
    category: 'Commercial & Retail',
    label: 'Industrial Shed',
    shortLabel: 'Industrial Shed',
    description: 'Covered industrial sheds and work areas.',
  },
  {
    value: 'INSTITUTIONAL',
    category: 'Commercial & Retail',
    label: 'Institutional Land',
    shortLabel: 'Institutional',
    description: 'Land intended for schools, hospitals, institutions and similar uses.',
  },

  // 4. Hospitality & Leisure
  {
    value: 'RESORT',
    category: 'Hospitality & Leisure',
    label: 'Resorts',
    shortLabel: 'Resort',
    description: 'Eco-resorts, leisure destinations, and wellness retreats.',
  },
  {
    value: 'HOTEL',
    category: 'Hospitality & Leisure',
    label: 'Hotels',
    shortLabel: 'Hotel',
    description: 'Commercial hotel properties, boutique stays, and lodges.',
  },
  {
    value: 'SERVICE_APARTMENT',
    category: 'Hospitality & Leisure',
    label: 'Service Apartments',
    shortLabel: 'Service Apt',
    description: 'Fully furnished serviced apartments for short and long-term stays.',
  },
  {
    value: 'GUEST_HOUSE',
    category: 'Hospitality & Leisure',
    label: 'Guest Houses',
    shortLabel: 'Guest House',
    description: 'Heritage bungalows, corporate guest houses, and homestays.',
  },
  {
    value: 'FARM_HOUSE_LAND',
    category: 'Hospitality & Leisure',
    label: 'Farmhouses',
    shortLabel: 'Farmhouse',
    description: 'Weekend villas, retreat farmhouses, and countryside estates.',
  },

  // 5. Income-Generating & Rental Formats
  {
    value: 'RESIDENTIAL_RENTAL',
    category: 'Income-Generating & Rentals',
    label: 'Residential Rentals',
    shortLabel: 'Rental',
    description: 'Rental homes, apartments, and houses with steady rental yield.',
  },
  {
    value: 'COMMERCIAL_LEASE',
    category: 'Income-Generating & Rentals',
    label: 'Commercial Leases',
    shortLabel: 'Comm. Lease',
    description: 'Pre-leased commercial offices, retail outlets, and leasehold investments.',
  },
  {
    value: 'COLIVING_PG',
    category: 'Income-Generating & Rentals',
    label: 'Co-living Spaces / PGs',
    shortLabel: 'Co-living/PG',
    description: 'Shared student and professional housing, paying guest accommodation.',
  },
  {
    value: 'VACATION_RENTAL_AIRBNB',
    category: 'Income-Generating & Rentals',
    label: 'Vacation Rentals / Airbnbs',
    shortLabel: 'Vacation Rental',
    description: 'High-yield holiday homes, Airbnb villas, and tourist chalets.',
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
    label: 'Verified',

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
