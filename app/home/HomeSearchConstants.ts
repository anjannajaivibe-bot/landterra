export const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'];

export const BUDGET_PRESETS = [
  { label: 'Any Budget', minPrice: 0, maxPrice: 0 },
  { label: 'Under ₹25 Lakhs', minPrice: 0, maxPrice: 2500000 },
  { label: '₹25L – ₹50 Lakhs', minPrice: 2500000, maxPrice: 5000000 },
  { label: '₹50L – ₹1 Crore', minPrice: 5000000, maxPrice: 10000000 },
  { label: '₹1 Cr – ₹3 Crores', minPrice: 10000000, maxPrice: 30000000 },
  { label: '₹3 Cr – ₹5 Crores', minPrice: 30000000, maxPrice: 50000000 },
  { label: '₹5 Cr – ₹10 Crores', minPrice: 50000000, maxPrice: 100000000 },
  { label: 'Above ₹10 Crores', minPrice: 100000000, maxPrice: 0 },
];

export const POPULAR_SEARCH_TAGS = [
  { label: 'Kokapet Plots', query: 'Kokapet' },
  { label: 'Moinabad Farmlands', query: 'Moinabad' },
  { label: 'Shamshabad Airport Zone', query: 'Shamshabad' },
  { label: 'Shankarpally Plots', query: 'Shankarpally' },
  { label: 'Vijayawada Highway', query: 'Vijayawada Highway' },
  { label: 'Bengaluru Rural', query: 'Bengaluru Rural' },
];

export const residentialTypesSupportingBhk = [
  'FLAT',
  'INDEPENDENT_HOUSE',
  'VILLA',
  'TOWNHOUSE',
  'DUPLEX',
  'PENTHOUSE',
  'FARMHOUSE',
  'SERVICE_APARTMENT',
];

export const RESIDENTIAL_TYPES_SUPPORTING_BHK = residentialTypesSupportingBhk;
