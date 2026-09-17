import { CANONICAL_PROPERTY_TYPES, CanonicalPropertyType } from '@/config/constants';

export type PropertyTypeOption = CanonicalPropertyType;

export const ALL_PROPERTY_TYPES: PropertyTypeOption[] = CANONICAL_PROPERTY_TYPES;

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
