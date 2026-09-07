export interface PropertyTypeOption {
  id: string;
  label: string;
  category:
    | 'Land & Plots'
    | 'Residential Units'
    | 'Commercial & Retail'
    | 'Hospitality & Leisure'
    | 'Income-Generating & Rentals';
}

export const ALL_PROPERTY_TYPES: PropertyTypeOption[] = [
  // 1. Land & Plots
  { id: 'OPEN_PLOT', label: 'Open Plots', category: 'Land & Plots' },
  { id: 'FARMLAND_PLOT', label: 'Farmland Plots', category: 'Land & Plots' },
  { id: 'GATED_COMMUNITY_PLOT', label: 'Gated Community Plots', category: 'Land & Plots' },
  { id: 'AGRICULTURAL_LAND', label: 'Agricultural Land', category: 'Land & Plots' },
  { id: 'RESIDENTIAL_PLOT', label: 'Residential Plots', category: 'Land & Plots' },

  // 2. Residential Units
  { id: 'FLAT', label: 'Flats / Apartments', category: 'Residential Units' },
  { id: 'INDEPENDENT_HOUSE', label: 'Independent Houses', category: 'Residential Units' },
  { id: 'VILLA', label: 'Villas', category: 'Residential Units' },
  { id: 'HOUSE_VILLA', label: 'House / Villa', category: 'Residential Units' },
  { id: 'TOWNHOUSE', label: 'Townhouses', category: 'Residential Units' },
  { id: 'DUPLEX', label: 'Duplexes', category: 'Residential Units' },
  { id: 'PENTHOUSE', label: 'Penthouses', category: 'Residential Units' },

  // 3. Commercial & Retail
  { id: 'RETAIL_SHOP', label: 'Retail Shops', category: 'Commercial & Retail' },
  { id: 'SHOWROOM', label: 'Showrooms', category: 'Commercial & Retail' },
  { id: 'OFFICE_SPACE', label: 'Office Spaces', category: 'Commercial & Retail' },
  { id: 'COWORKING_SPACE', label: 'Co-working Spaces', category: 'Commercial & Retail' },
  { id: 'SHOPPING_MALL', label: 'Shopping Malls', category: 'Commercial & Retail' },
  { id: 'WAREHOUSE_LAND', label: 'Warehouses / Godowns', category: 'Commercial & Retail' },
  { id: 'COMMERCIAL_LAND', label: 'Commercial Land', category: 'Commercial & Retail' },

  // 4. Hospitality & Leisure
  { id: 'RESORT', label: 'Resorts', category: 'Hospitality & Leisure' },
  { id: 'HOTEL', label: 'Hotels', category: 'Hospitality & Leisure' },
  { id: 'SERVICE_APARTMENT', label: 'Service Apartments', category: 'Hospitality & Leisure' },
  { id: 'GUEST_HOUSE', label: 'Guest Houses', category: 'Hospitality & Leisure' },
  { id: 'FARM_HOUSE_LAND', label: 'Farmhouses', category: 'Hospitality & Leisure' },

  // 5. Income-Generating & Rentals
  { id: 'RESIDENTIAL_RENTAL', label: 'Residential Rentals', category: 'Income-Generating & Rentals' },
  { id: 'COMMERCIAL_LEASE', label: 'Commercial Leases', category: 'Income-Generating & Rentals' },
  { id: 'COLIVING_PG', label: 'Co-living Spaces / PGs', category: 'Income-Generating & Rentals' },
  { id: 'VACATION_RENTAL_AIRBNB', label: 'Vacation Rentals / Airbnbs', category: 'Income-Generating & Rentals' },
];

export const BHK_OPTIONS = ['1 Bhk', '2 Bhk', '3 Bhk', '4 Bhk', '5 Bhk', '5+ Bhk'];

export const RESIDENTIAL_TYPES_SUPPORTING_BHK = [
  'FLAT',
  'INDEPENDENT_HOUSE',
  'VILLA',
  'HOUSE_VILLA',
  'TOWNHOUSE',
  'DUPLEX',
  'PENTHOUSE',
  'SERVICE_APARTMENT',
  'RESIDENTIAL_RENTAL',
  'COLIVING_PG',
  'VACATION_RENTAL_AIRBNB',
];

export const DEFAULT_MAX_PRICE = 100000000; // 10 Cr
export const DEFAULT_MAX_AREA = 10000;
export const RESULTS_PER_PAGE = 9;

export const BUDGET_PRESETS = [
  { label: 'Any Budget', minPrice: 0, maxPrice: DEFAULT_MAX_PRICE },
  { label: 'Under ₹25 Lakhs', minPrice: 0, maxPrice: 2500000 },
  { label: '₹25L – ₹50 Lakhs', minPrice: 2500000, maxPrice: 5000000 },
  { label: '₹50L – ₹1 Crore', minPrice: 5000000, maxPrice: 10000000 },
  { label: '₹1 Cr – ₹3 Crores', minPrice: 10000000, maxPrice: 30000000 },
  { label: '₹3 Cr – ₹5 Crores', minPrice: 30000000, maxPrice: 50000000 },
  { label: '₹5 Cr – ₹10 Crores', minPrice: 50000000, maxPrice: 100000000 },
  { label: 'Above ₹10 Crores', minPrice: 100000000, maxPrice: DEFAULT_MAX_PRICE },
];

export const AREA_PRESETS = [
  { label: 'Any Area', minArea: 0, maxArea: DEFAULT_MAX_AREA },
  { label: '< 300 sq.yd', minArea: 0, maxArea: 300 },
  { label: '300 – 600 sq.yd', minArea: 300, maxArea: 600 },
  { label: '600 – 1,500 sq.yd', minArea: 600, maxArea: 1500 },
  { label: '1,500 – 5,000 sq.yd', minArea: 1500, maxArea: 5000 },
  { label: 'Above 5,000 sq.yd', minArea: 5000, maxArea: DEFAULT_MAX_AREA },
];

export function formatIndianCurrency(value: number): string {
  if (value >= 10000000) {
    const cr = value / 10000000;
    return `₹${cr.toFixed(value % 10000000 === 0 ? 0 : 1)} Cr`;
  }
  if (value >= 100000) {
    const l = value / 100000;
    return `₹${l.toFixed(value % 100000 === 0 ? 0 : 1)} L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(0)}K`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

export function formatArea(value: number): string {
  return `${value.toLocaleString('en-IN')} sq. yd`;
}
