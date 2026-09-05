'use client';

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  RotateCcw,
  ShieldCheck,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  ArrowUpDown,
  LandPlot,
  Check,
  Sparkles,
  Home as HomeIcon,
  Building2,
} from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { DueDiligenceChecklist } from '@/components/legal/DueDiligenceChecklist';
import { IProperty } from '@/types/property';
import { INDIAN_STATES } from '@/config/constants';

/* ================================================================
   PROPERTY TYPE CONFIG (Multi-section matching Home Page)
================================================================ */

interface PropertyTypeOption {
  id: string;
  label: string;
  category:
    | 'Land & Plots'
    | 'Residential Units'
    | 'Commercial & Retail'
    | 'Hospitality & Leisure'
    | 'Income-Generating & Rentals';
}

const ALL_PROPERTY_TYPES: PropertyTypeOption[] = [
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

const BHK_OPTIONS = ['1 Bhk', '2 Bhk', '3 Bhk', '4 Bhk', '5 Bhk', '5+ Bhk'];

/* Pass exact UI Property Types to API */
function mapPropertyTypesToDbLandTypes(typeIds: string[]): string[] {
  return typeIds;
}

/* ================================================================
   CONSTANTS (Shared with Home Page)
================================================================ */

const DEFAULT_MAX_PRICE = 100000000; // 10 Cr
const DEFAULT_MAX_AREA = 10000;
const RESULTS_PER_PAGE = 9;

const BUDGET_PRESETS = [
  { label: 'Any Budget', minPrice: 0, maxPrice: DEFAULT_MAX_PRICE },
  { label: 'Under ₹25 Lakhs', minPrice: 0, maxPrice: 2500000 },
  { label: '₹25L – ₹50 Lakhs', minPrice: 2500000, maxPrice: 5000000 },
  { label: '₹50L – ₹1 Crore', minPrice: 5000000, maxPrice: 10000000 },
  { label: '₹1 Cr – ₹3 Crores', minPrice: 10000000, maxPrice: 30000000 },
  { label: '₹3 Cr – ₹5 Crores', minPrice: 30000000, maxPrice: 50000000 },
  { label: '₹5 Cr – ₹10 Crores', minPrice: 50000000, maxPrice: 100000000 },
  { label: 'Above ₹10 Crores', minPrice: 100000000, maxPrice: DEFAULT_MAX_PRICE },
];

const AREA_PRESETS = [
  { label: 'Any Area', minArea: 0, maxArea: DEFAULT_MAX_AREA },
  { label: '< 300 sq.yd', minArea: 0, maxArea: 300 },
  { label: '300 – 600 sq.yd', minArea: 300, maxArea: 600 },
  { label: '600 – 1,500 sq.yd', minArea: 600, maxArea: 1500 },
  { label: '1,500 – 5,000 sq.yd', minArea: 1500, maxArea: 5000 },
  { label: 'Above 5,000 sq.yd', minArea: 5000, maxArea: DEFAULT_MAX_AREA },
];

/* ================================================================
   HELPERS
================================================================ */

function formatIndianCurrency(value: number) {
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

function formatArea(value: number) {
  return `${value.toLocaleString('en-IN')} sq. yd`;
}

/* ================================================================
   PAGE CONTENT
================================================================ */

function BuyPageContent() {
  const searchParams = useSearchParams();

  /* ---------------------------------------------------------------
     FILTER STATE (Initialized from Home Page URL query parameters)
  --------------------------------------------------------------- */

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('query') || searchParams.get('city') || '',
  );

  /* Multi-select Property Types */
  const initialPropertyTypes = useMemo(() => {
    const param = searchParams.get('landType');
    if (!param || param === 'ALL') return [];
    return param.split(',').map((p) => p.trim()).filter(Boolean);
  }, [searchParams]);

  const [selectedPropertyTypes, setSelectedPropertyTypes] =
    useState<string[]>(initialPropertyTypes);

  const [selectedBhks, setSelectedBhks] = useState<string[]>(() => {
    const bhkParam = searchParams.get('bhk');
    return bhkParam ? bhkParam.split(',').map((b) => b.trim()).filter(Boolean) : [];
  });

  const [selectedState, setSelectedState] = useState(
    searchParams.get('state') || 'ALL',
  );

  const [verifiedOnly, setVerifiedOnly] = useState(
    searchParams.get('verifiedOnly') === 'true',
  );

  const [minPrice, setMinPrice] = useState(
    Number(searchParams.get('minPrice')) || 0,
  );

  const [maxPrice, setMaxPrice] = useState(
    Number(searchParams.get('maxPrice')) || DEFAULT_MAX_PRICE,
  );

  const [minArea, setMinArea] = useState(
    Number(searchParams.get('minArea')) || 0,
  );

  const [maxArea, setMaxArea] = useState(
    Number(searchParams.get('maxArea')) || DEFAULT_MAX_AREA,
  );

  const [sortBy, setSortBy] = useState(
    searchParams.get('sortBy') || 'newest',
  );

  const [page, setPage] = useState(
    Number(searchParams.get('page')) || 1,
  );

  /* Popover states for horizontal filter bar */
  const [propertyTypePopoverOpen, setPropertyTypePopoverOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<{
    landPlots: boolean;
    residential: boolean;
    commercial: boolean;
    hospitality: boolean;
    rentals: boolean;
  }>({
    landPlots: true,
    residential: true,
    commercial: false,
    hospitality: false,
    rentals: false,
  });

  const propertyTypeRef = useRef<HTMLDivElement>(null);

  /* Close property type popover on outside click */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        propertyTypeRef.current &&
        !propertyTypeRef.current.contains(e.target as Node)
      ) {
        setPropertyTypePopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (
    cat: 'landPlots' | 'residential' | 'commercial' | 'hospitality' | 'rentals',
  ) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const residentialTypesSupportingBhk = [
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

  const handleTogglePropertyType = (id: string) => {
    setSelectedPropertyTypes((prev) => {
      const next = prev.includes(id)
        ? prev.filter((t) => t !== id)
        : [...prev, id];

      // If no residential unit is selected, clear BHKs
      if (!next.some((t) => residentialTypesSupportingBhk.includes(t))) {
        setSelectedBhks([]);
      }
      return next;
    });
    setPage(1);
  };

  const handleToggleBhk = (bhk: string) => {
    setSelectedBhks((prev) =>
      prev.includes(bhk) ? prev.filter((b) => b !== bhk) : [...prev, bhk]
    );
    setPage(1);
  };

  /* ---------------------------------------------------------------
     DATA STATE
  --------------------------------------------------------------- */

  const [properties, setProperties] = useState<IProperty[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---------------------------------------------------------------
     SMOOTH SCROLL TO PROPERTIES SECTION
  --------------------------------------------------------------- */

  const scrollToProperties = useCallback(() => {
    setTimeout(() => {
      const el = document.getElementById('properties-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  }, []);

  /* If page opened with search params from home page, auto-scroll to properties */
  useEffect(() => {
    const hasIncomingParams =
      searchParams.get('query') ||
      searchParams.get('city') ||
      searchParams.get('landType') ||
      searchParams.get('minPrice') ||
      searchParams.get('maxPrice') ||
      searchParams.get('state');

    if (hasIncomingParams) {
      const timer = setTimeout(() => {
        scrollToProperties();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [searchParams, scrollToProperties]);

  /* ---------------------------------------------------------------
     ACTIVE FILTER COUNT
  --------------------------------------------------------------- */

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedPropertyTypes.length > 0) count++;
    if (selectedBhks.length > 0) count++;
    if (selectedState !== 'ALL') count++;
    if (verifiedOnly) count++;
    if (minPrice > 0) count++;
    if (maxPrice < DEFAULT_MAX_PRICE) count++;
    if (minArea > 0) count++;
    if (maxArea < DEFAULT_MAX_AREA) count++;
    return count;
  }, [
    searchQuery,
    selectedPropertyTypes,
    selectedBhks,
    selectedState,
    verifiedOnly,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
  ]);

  /* Find active budget preset index */
  const selectedBudgetIndex = useMemo(() => {
    const idx = BUDGET_PRESETS.findIndex((b) => {
      if (b.minPrice === 0 && b.maxPrice === DEFAULT_MAX_PRICE) {
        return minPrice === 0 && maxPrice >= DEFAULT_MAX_PRICE;
      }
      return b.minPrice === minPrice && b.maxPrice === maxPrice;
    });
    return idx >= 0 ? idx : 0;
  }, [minPrice, maxPrice]);

  /* Find active area preset index */
  const selectedAreaIndex = useMemo(() => {
    const idx = AREA_PRESETS.findIndex((a) => {
      if (a.minArea === 0 && a.maxArea === DEFAULT_MAX_AREA) {
        return minArea === 0 && maxArea >= DEFAULT_MAX_AREA;
      }
      return a.minArea === minArea && a.maxArea === maxArea;
    });
    return idx >= 0 ? idx : 0;
  }, [minArea, maxArea]);

  /* Trigger button text for Property Type */
  const propertyTypeTriggerText = useMemo(() => {
    if (selectedPropertyTypes.length === 0) return 'All Property Types';
    if (selectedPropertyTypes.length === 1) {
      const found = ALL_PROPERTY_TYPES.find((t) => t.id === selectedPropertyTypes[0]);
      let txt = found ? found.label : selectedPropertyTypes[0];
      if (
        (selectedPropertyTypes[0] === 'FLAT' || selectedPropertyTypes[0] === 'HOUSE_VILLA') &&
        selectedBhks.length > 0
      ) {
        txt += ` (${selectedBhks.join(', ')})`;
      }
      return txt;
    }
    return `${selectedPropertyTypes.length} Property Types`;
  }, [selectedPropertyTypes, selectedBhks]);

  /* ================================================================
     FETCH PROPERTIES
  ================================================================= */

  useEffect(() => {
    let cancelled = false;

    const fetchProperties = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();

        if (searchQuery.trim()) {
          params.set('query', searchQuery.trim());
        }

        if (selectedPropertyTypes.length > 0) {
          params.set('landType', selectedPropertyTypes.join(','));
        }

        if (selectedBhks.length > 0) {
          params.set('bhk', selectedBhks.join(','));
        }

        if (selectedState !== 'ALL') {
          params.set('state', selectedState);
        }

        if (verifiedOnly) {
          params.set('verifiedOnly', 'true');
        }

        if (minPrice > 0) {
          params.set('minPrice', String(minPrice));
        }

        if (maxPrice < DEFAULT_MAX_PRICE) {
          params.set('maxPrice', String(maxPrice));
        }

        if (minArea > 0) {
          params.set('minArea', String(minArea));
        }

        if (maxArea < DEFAULT_MAX_AREA) {
          params.set('maxArea', String(maxArea));
        }

        params.set('sortBy', sortBy);
        params.set('page', String(page));
        params.set('limit', String(RESULTS_PER_PAGE));

        const response = await fetch(`/api/properties?${params.toString()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Unable to load listings.');
        }

        const data = await response.json();

        if (cancelled) return;

        setProperties(Array.isArray(data?.data) ? data.data : []);
        setTotalCount(Number(data?.total) || 0);
        setTotalPages(Math.max(Number(data?.totalPages) || 1, 1));
      } catch (err) {
        if (cancelled) return;
        console.error('Marketplace loading error:', err);
        setProperties([]);
        setTotalCount(0);
        setTotalPages(1);
        setError('We could not load the property listings right now. Please try again.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProperties();

    return () => {
      cancelled = true;
    };
  }, [
    searchQuery,
    selectedPropertyTypes,
    selectedBhks,
    selectedState,
    verifiedOnly,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    sortBy,
    page,
  ]);

  /* ================================================================
     FILTER HANDLERS
  ================================================================= */

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPropertyTypes([]);
    setSelectedBhks([]);
    setSelectedState('ALL');
    setVerifiedOnly(false);
    setMinPrice(0);
    setMaxPrice(DEFAULT_MAX_PRICE);
    setMinArea(0);
    setMaxArea(DEFAULT_MAX_AREA);
    setSortBy('newest');
    setPage(1);
  };

  const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    setPage(1);
    scrollToProperties();
  };

  const updateState = (value: string) => {
    setSelectedState(value);
    setPage(1);
  };

  const updateVerified = (value: boolean) => {
    setVerifiedOnly(value);
    setPage(1);
  };

  const updateSort = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const handleBudgetPresetChange = (index: number) => {
    const preset = BUDGET_PRESETS[index];
    if (preset) {
      setMinPrice(preset.minPrice);
      setMaxPrice(preset.maxPrice === 0 ? DEFAULT_MAX_PRICE : preset.maxPrice);
      setPage(1);
    }
  };

  const handleAreaPresetChange = (index: number) => {
    const preset = AREA_PRESETS[index];
    if (preset) {
      setMinArea(preset.minArea);
      setMaxArea(preset.maxArea === 0 ? DEFAULT_MAX_AREA : preset.maxArea);
      setPage(1);
    }
  };

  /* ================================================================
     RENDER
  ================================================================= */

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900">
      <Navbar />

      {/* Hero Search & Horizontal Filter Section - Indian Deep Saffron & Crisp White */}
      <section className="relative border-b border-slate-200/80 bg-gradient-to-b from-[#fffaf4] via-white to-[#fbfcfe] pt-7 pb-8 sm:pt-10 sm:pb-11">
        {/* Subtle decorative saffron glow confined to background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-[#FF9933]/10 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-[#FF9933]/05 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb & Trust Tag */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-slate-500 font-medium">
              <Link href="/" className="transition-colors hover:text-[#c75e0a] flex items-center gap-1">
                <HomeIcon className="w-3.5 h-3.5 text-[#FF9933]" />
                <span>Home</span>
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-bold">Property Marketplace</span>
            </nav>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FF9933]/30 bg-[#fff1dc] px-3 py-1 text-[11px] font-black text-[#c75e0a] shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-[#FF9933]" />
              <span>Direct From Owners • 0% Brokerage</span>
            </div>
          </div>

          {/* Heading */}
          <div className="max-w-3xl">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-4xl">
              Direct Real Estate &amp; Properties{' '}
              <span className="text-[#FF9933]">Marketplace</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
              Browse direct owner properties — plots, apartments, houses, villas, commercial spaces, and farmlands across India with zero broker commissions.
            </p>
          </div>

          {/* Search Omnibar & Horizontal Filter Controls */}
          <form onSubmit={handleSearchSubmit} className="relative z-30 mt-6 w-full">
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-3.5 sm:p-5 transition-all focus-within:border-[#FF9933]/40">
              {/* Row 1: Search Omnibar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex-1 flex items-center px-4 py-3 rounded-2xl bg-[#f8fafc] border border-slate-200/80 focus-within:bg-white focus-within:border-[#FF9933]/60 focus-within:ring-2 focus-within:ring-[#FF9933]/15 transition-all">
                  <MapPin className="h-4 w-4 text-[#FF9933] shrink-0 mr-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Enter city, locality, district, or project e.g. Kokapet, Visakhapatnam, Hyderabad, Bengaluru..."
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setPage(1);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title="Clear location"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF9933] hover:bg-[#f07d12] px-8 py-3.5 text-xs sm:text-sm font-black text-white shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
                >
                  <Search className="h-4 w-4" />
                  <span>Search Properties</span>
                </button>
              </div>

              {/* Row 2: Horizontal Filter Controls Under Search Bar */}
              <div className="mt-3.5 pt-3.5 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
                  {/* 1. Property Type with Multi-section Popover */}
                  <div ref={propertyTypeRef} className="relative z-40">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Property Type
                    </label>
                    <button
                      type="button"
                      onClick={() => setPropertyTypePopoverOpen(!propertyTypePopoverOpen)}
                      className={`w-full inline-flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all border cursor-pointer select-none ${
                        selectedPropertyTypes.length > 0
                          ? 'bg-[#fff1dc] border-[#FF9933] text-[#c75e0a]'
                          : 'bg-[#f8fafc] hover:bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
                        <span className="truncate">{propertyTypeTriggerText}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                          propertyTypePopoverOpen ? 'rotate-180 text-[#FF9933]' : ''
                        }`}
                      />
                    </button>

                    {/* Multi-Section Popover Card */}
                    {propertyTypePopoverOpen && (
                      <div className="absolute left-0 top-[calc(100%+8px)] z-[100] w-[300px] sm:w-[380px] p-4 rounded-3xl bg-white border border-slate-200 shadow-[0_25px_60px_rgba(0,0,0,0.22)] animate-in fade-in slide-in-from-top-2 duration-150 space-y-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                            Select Property Types
                          </span>
                          {selectedPropertyTypes.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPropertyTypes([]);
                                setSelectedBhks([]);
                                setPage(1);
                              }}
                              className="text-[10px] font-bold text-[#c75e0a] hover:underline cursor-pointer"
                            >
                              Clear Selection
                            </button>
                          )}
                        </div>

                        {/* 1. Land & Plots */}
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => toggleCategory('landPlots')}
                            className="w-full flex items-center justify-between py-1 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span>Land &amp; Plots</span>
                              {ALL_PROPERTY_TYPES.filter(
                                (t) => t.category === 'Land & Plots' && selectedPropertyTypes.includes(t.id),
                              ).length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#fff1dc] text-[#c75e0a] text-[10px] font-bold">
                                  {
                                    ALL_PROPERTY_TYPES.filter(
                                      (t) =>
                                        t.category === 'Land & Plots' &&
                                        selectedPropertyTypes.includes(t.id),
                                    ).length
                                  }
                                </span>
                              )}
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                expandedCategories.landPlots ? 'rotate-180 text-[#FF9933]' : ''
                              }`}
                            />
                          </button>

                          {expandedCategories.landPlots && (
                            <div className="flex flex-wrap gap-1.5 pt-1 animate-in fade-in duration-150">
                              {ALL_PROPERTY_TYPES.filter((t) => t.category === 'Land & Plots').map((t) => {
                                const isSelected = selectedPropertyTypes.includes(t.id);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleTogglePropertyType(t.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                                      isSelected
                                        ? 'bg-[#fff1dc] text-[#c75e0a] border-[#FF9933] shadow-2xs ring-1 ring-[#FF9933]/30'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {t.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 2. Residential Units */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleCategory('residential')}
                            className="w-full flex items-center justify-between py-1 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span>Residential Units</span>
                              {ALL_PROPERTY_TYPES.filter(
                                (t) => t.category === 'Residential Units' && selectedPropertyTypes.includes(t.id),
                              ).length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#fff1dc] text-[#c75e0a] text-[10px] font-bold">
                                  {
                                    ALL_PROPERTY_TYPES.filter(
                                      (t) =>
                                        t.category === 'Residential Units' &&
                                        selectedPropertyTypes.includes(t.id),
                                    ).length
                                  }
                                </span>
                              )}
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                expandedCategories.residential ? 'rotate-180 text-[#FF9933]' : ''
                              }`}
                            />
                          </button>

                          {expandedCategories.residential && (
                            <div className="space-y-2.5 pt-1">
                              <div className="flex flex-wrap gap-1.5">
                                {ALL_PROPERTY_TYPES.filter((t) => t.category === 'Residential Units').map((t) => {
                                  const isSelected = selectedPropertyTypes.includes(t.id);
                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => handleTogglePropertyType(t.id)}
                                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                                        isSelected
                                          ? 'bg-[#fff1dc] text-[#c75e0a] border-[#FF9933] shadow-2xs ring-1 ring-[#FF9933]/30'
                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                      }`}
                                    >
                                      {t.label}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* BHK Sub-selector */}
                              {selectedPropertyTypes.some((t) => residentialTypesSupportingBhk.includes(t)) && (
                                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Number of Bedrooms (BHK)
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {BHK_OPTIONS.map((bhk) => {
                                      const isBhkSelected = selectedBhks.includes(bhk);
                                      return (
                                        <button
                                          key={bhk}
                                          type="button"
                                          onClick={() => handleToggleBhk(bhk)}
                                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                                            isBhkSelected
                                              ? 'bg-[#FF9933] text-white border-[#FF9933]'
                                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                          }`}
                                        >
                                          {bhk}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 3. Commercial & Retail */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleCategory('commercial')}
                            className="w-full flex items-center justify-between py-1 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span>Commercial &amp; Retail</span>
                              {ALL_PROPERTY_TYPES.filter(
                                (t) => t.category === 'Commercial & Retail' && selectedPropertyTypes.includes(t.id),
                              ).length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#fff1dc] text-[#c75e0a] text-[10px] font-bold">
                                  {
                                    ALL_PROPERTY_TYPES.filter(
                                      (t) =>
                                        t.category === 'Commercial & Retail' &&
                                        selectedPropertyTypes.includes(t.id),
                                    ).length
                                  }
                                </span>
                              )}
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                expandedCategories.commercial ? 'rotate-180 text-[#FF9933]' : ''
                              }`}
                            />
                          </button>

                          {expandedCategories.commercial && (
                            <div className="flex flex-wrap gap-1.5 pt-1 animate-in fade-in duration-150">
                              {ALL_PROPERTY_TYPES.filter((t) => t.category === 'Commercial & Retail').map((t) => {
                                const isSelected = selectedPropertyTypes.includes(t.id);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleTogglePropertyType(t.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                                      isSelected
                                        ? 'bg-[#fff1dc] text-[#c75e0a] border-[#FF9933] shadow-2xs ring-1 ring-[#FF9933]/30'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {t.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 4. Hospitality & Leisure */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleCategory('hospitality')}
                            className="w-full flex items-center justify-between py-1 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span>Hospitality &amp; Leisure</span>
                              {ALL_PROPERTY_TYPES.filter(
                                (t) =>
                                  t.category === 'Hospitality & Leisure' &&
                                  selectedPropertyTypes.includes(t.id),
                              ).length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#fff1dc] text-[#c75e0a] text-[10px] font-bold">
                                  {
                                    ALL_PROPERTY_TYPES.filter(
                                      (t) =>
                                        t.category === 'Hospitality & Leisure' &&
                                        selectedPropertyTypes.includes(t.id),
                                    ).length
                                  }
                                </span>
                              )}
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                expandedCategories.hospitality ? 'rotate-180 text-[#FF9933]' : ''
                              }`}
                            />
                          </button>

                          {expandedCategories.hospitality && (
                            <div className="flex flex-wrap gap-1.5 pt-1 animate-in fade-in duration-150">
                              {ALL_PROPERTY_TYPES.filter((t) => t.category === 'Hospitality & Leisure').map((t) => {
                                const isSelected = selectedPropertyTypes.includes(t.id);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleTogglePropertyType(t.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                                      isSelected
                                        ? 'bg-[#fff1dc] text-[#c75e0a] border-[#FF9933] shadow-2xs ring-1 ring-[#FF9933]/30'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {t.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 5. Income-Generating & Rentals */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleCategory('rentals')}
                            className="w-full flex items-center justify-between py-1 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span>Income-Generating &amp; Rentals</span>
                              {ALL_PROPERTY_TYPES.filter(
                                (t) =>
                                  t.category === 'Income-Generating & Rentals' &&
                                  selectedPropertyTypes.includes(t.id),
                              ).length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#fff1dc] text-[#c75e0a] text-[10px] font-bold">
                                  {
                                    ALL_PROPERTY_TYPES.filter(
                                      (t) =>
                                        t.category === 'Income-Generating & Rentals' &&
                                        selectedPropertyTypes.includes(t.id),
                                    ).length
                                  }
                                </span>
                              )}
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                expandedCategories.rentals ? 'rotate-180 text-[#FF9933]' : ''
                              }`}
                            />
                          </button>

                          {expandedCategories.rentals && (
                            <div className="flex flex-wrap gap-1.5 pt-1 animate-in fade-in duration-150">
                              {ALL_PROPERTY_TYPES.filter((t) => t.category === 'Income-Generating & Rentals').map((t) => {
                                const isSelected = selectedPropertyTypes.includes(t.id);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleTogglePropertyType(t.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                                      isSelected
                                        ? 'bg-[#fff1dc] text-[#c75e0a] border-[#FF9933] shadow-2xs ring-1 ring-[#FF9933]/30'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {t.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Geographic Region / State (All 36 Indian States & UTs) */}
                  <div className="relative">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Region / State
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => updateState(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] hover:bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-colors focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20 cursor-pointer"
                    >
                      <option value="ALL">All India (Any State / UT)</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Budget (Matching Home Page BUDGET_PRESETS) */}
                  <div className="relative">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Budget Range
                    </label>
                    <select
                      value={selectedBudgetIndex}
                      onChange={(e) => handleBudgetPresetChange(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] hover:bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-colors focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20 cursor-pointer"
                    >
                      {BUDGET_PRESETS.map((preset, idx) => (
                        <option key={preset.label} value={idx}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Land Extent / Area */}
                  <div className="relative">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Land Area
                    </label>
                    <select
                      value={selectedAreaIndex}
                      onChange={(e) => handleAreaPresetChange(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] hover:bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-colors focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20 cursor-pointer"
                    >
                      {AREA_PRESETS.map((preset, idx) => (
                        <option key={preset.label} value={idx}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Direct Landowner Only Toggle */}
                  <div className="flex flex-col justify-end">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Ownership
                    </label>
                    <button
                      type="button"
                      onClick={() => updateVerified(!verifiedOnly)}
                      className={`w-full inline-flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all border cursor-pointer ${
                        verifiedOnly
                          ? 'bg-[#fff1dc] border-[#FF9933] text-[#c75e0a] shadow-2xs'
                          : 'bg-[#f8fafc] border-slate-200 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <ShieldCheck className={`w-3.5 h-3.5 ${verifiedOnly ? 'text-[#FF9933]' : 'text-slate-400'}`} />
                        <span className="truncate">Direct Landowner</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                          verifiedOnly
                            ? 'bg-[#FF9933] border-[#FF9933] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {verifiedOnly && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Quick Category Chips */}
          <div className="relative z-10 mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Popular:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedPropertyTypes([]);
                setSelectedBhks([]);
                setPage(1);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                selectedPropertyTypes.length === 0
                  ? 'bg-[#FF9933] border-[#FF9933] text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#FF9933]/50 hover:bg-[#fffbf5]'
              }`}
            >
              All Properties
            </button>

            {[
              { label: 'Residential Plots', id: 'RESIDENTIAL_PLOT' },
              { label: 'Flats & Apartments', id: 'FLAT' },
              { label: 'Houses & Villas', id: 'HOUSE_VILLA' },
              { label: 'Commercial Land', id: 'COMMERCIAL_LAND' },
              { label: 'Farmlands', id: 'AGRICULTURAL_LAND' },
              { label: 'Farm Houses', id: 'FARM_HOUSE_LAND' },
            ].map((cat) => {
              const isActive = selectedPropertyTypes.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleTogglePropertyType(cat.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-[#FF9933] border-[#FF9933] text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-[#FF9933]/50 hover:bg-[#fffbf5]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Layout (Full Width, One Card per Row) */}
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section id="properties-section" className="w-full">
          {/* Results Toolbar */}
          <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-white border border-slate-200/80 p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Available Properties
                </h2>

                {!loading && (
                  <span className="rounded-full bg-[#fff1dc] border border-[#FF9933]/30 px-2.5 py-0.5 text-[11px] font-black text-[#c75e0a]">
                    {totalCount.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                {activeFilterCount > 0
                  ? `${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'} applied`
                  : 'Showing direct-from-owner property records'}
              </p>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-[#f8fafc] px-3 py-1.5 rounded-xl border border-slate-200">
                <ArrowUpDown className="h-3.5 w-3.5 text-[#FF9933] shrink-0" />
                <label htmlFor="sort" className="text-xs font-bold text-slate-500 hidden sm:inline">
                  Sort:
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(event) => updateSort(event.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="area_asc">Area: Small to Large</option>
                  <option value="area_desc">Area: Large to Small</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filters Pill Bar */}
          {activeFilterCount > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Filters:
              </span>

              {searchQuery.trim() && (
                <FilterChip
                  label={`Location: ${searchQuery}`}
                  onRemove={() => {
                    setSearchQuery('');
                    setPage(1);
                  }}
                />
              )}

              {selectedPropertyTypes.map((typeId) => {
                const found = ALL_PROPERTY_TYPES.find((t) => t.id === typeId);
                return (
                  <FilterChip
                    key={typeId}
                    label={`Type: ${found ? found.label : typeId}`}
                    onRemove={() => handleTogglePropertyType(typeId)}
                  />
                );
              })}

              {selectedBhks.map((bhk) => (
                <FilterChip
                  key={bhk}
                  label={bhk}
                  onRemove={() => handleToggleBhk(bhk)}
                />
              ))}

              {selectedState !== 'ALL' && (
                <FilterChip
                  label={`State: ${selectedState}`}
                  onRemove={() => updateState('ALL')}
                />
              )}

              {verifiedOnly && (
                <FilterChip
                  label="Direct Landowner Only"
                  onRemove={() => updateVerified(false)}
                />
              )}

              {maxPrice < DEFAULT_MAX_PRICE && (
                <FilterChip
                  label={`Max Budget: ${formatIndianCurrency(maxPrice)}`}
                  onRemove={() => {
                    setMaxPrice(DEFAULT_MAX_PRICE);
                    setPage(1);
                  }}
                />
              )}

              {maxArea < DEFAULT_MAX_AREA && (
                <FilterChip
                  label={`Max Area: ${formatArea(maxArea)}`}
                  onRemove={() => {
                    setMaxArea(DEFAULT_MAX_AREA);
                    setPage(1);
                  }}
                />
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-1 text-xs font-black text-[#c75e0a] hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Error State */}
          {error ? (
            <div className="rounded-3xl border border-rose-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <X className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Listings could not be loaded
              </h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setPage(1)}
                className="mt-5 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] px-5 py-2.5 text-xs font-black text-white shadow-sm transition-colors cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col gap-5 sm:gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <PropertyCardSkeleton key={index} />
              ))}
            </div>
          ) : properties.length === 0 ? (
            /* High Impact Clean Empty State */
            <div className="rounded-3xl border border-slate-200/90 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1dc] text-[#FF9933]">
                <LandPlot className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                No Properties Match This Criteria
              </h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500 font-medium">
                There are currently no listings matching your exact filters. Try expanding your search location, selecting other property types, adjusting your budget range, or clearing active filters.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] px-6 py-3 text-xs font-black text-white shadow-sm transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset All Filters</span>
                </button>
                <Link
                  href="/sell"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-xs font-bold text-slate-700 transition-colors"
                >
                  <span>+ List Your Property</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Classifieds Marketplace Notice */}
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#FF9933]/30 bg-[#fff9f0] p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#FF9933]" />
                <div>
                  <p className="text-xs font-bold text-[#c75e0a]">
                    Classifieds Marketplace Notice (0% Brokerage)
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#7a3705] leading-relaxed">
                    LandTerra / BhoomiMitra is an open classifieds advertising portal connecting buyers and sellers directly. We do not verify property titles. Buyers are required to inspect original registered sale deeds, EC Form 15, revenue extracts, and survey maps before executing transactions.
                  </p>
                </div>
              </div>

              {/* Property List (Horizontal layout - 1 card per row) */}
              <div className="flex flex-col gap-5 sm:gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property._id} property={property} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-2xs sm:flex-row">
                  <p className="text-xs text-slate-500 font-medium">
                    Showing Page{' '}
                    <strong className="text-slate-900 font-black">{page}</strong> of{' '}
                    <strong className="text-slate-900 font-black">{totalPages}</strong>
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => Math.max(current - 1, 1))}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                        const pageNum = i + 1;
                        const isActive = page === pageNum;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#FF9933] text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] px-3.5 text-xs font-black text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Buyer Due Diligence Advisory Guide at Bottom of Marketplace */}
              <div className="mt-12">
                <DueDiligenceChecklist />
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ================================================================
   ACTIVE FILTER CHIP
================================================================ */

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-[240px] items-center gap-1.5 rounded-full border border-[#FF9933]/30 bg-[#fff9f0] px-3 py-1 text-xs font-bold text-[#c75e0a] shadow-2xs transition-all hover:bg-[#fff1dc] hover:border-[#FF9933]/60 cursor-pointer"
    >
      <span className="truncate">{label}</span>
      <X className="h-3.5 w-3.5 shrink-0 text-[#FF9933]" />
    </button>
  );
}

/* ================================================================
   SKELETON LOADER
================================================================ */

function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xs flex flex-col md:flex-row">
      <div className="w-full md:w-[320px] lg:w-[360px] xl:w-[380px] aspect-[16/10] md:aspect-auto min-h-[220px] md:min-h-[260px] shrink-0 shimmer" />
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 rounded-full shimmer" />
            <div className="h-7 w-32 rounded-xl shimmer" />
          </div>
          <div className="h-6 w-3/4 rounded-lg shimmer" />
          <div className="h-4 w-1/2 rounded-md shimmer" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 p-3">
          <div className="h-10 rounded-xl shimmer-light" />
          <div className="h-10 rounded-xl shimmer-light" />
          <div className="h-10 rounded-xl shimmer-light col-span-2 sm:col-span-1" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="h-4 w-36 rounded-md shimmer" />
          <div className="h-9 w-28 rounded-xl shimmer" />
        </div>
      </div>
    </div>
  );
}

function BuyPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero / Search Section Skeleton */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 py-10 sm:py-14 text-white">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-4 text-center flex flex-col items-center">
            <div className="h-7 w-52 rounded-full shimmer bg-slate-800" />
            <div className="h-9 sm:h-11 w-4/5 max-w-xl rounded-2xl shimmer bg-slate-800" />
            <div className="h-4 w-3/5 max-w-md rounded-lg shimmer bg-slate-800/80" />

            <div className="mt-4 w-full rounded-2xl bg-white/10 p-2 backdrop-blur-md border border-white/15">
              <div className="h-12 w-full rounded-xl shimmer bg-slate-800/90" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout Skeleton */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Filter Sidebar Skeleton */}
          <aside className="w-full lg:w-72 shrink-0 hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="h-5 w-28 rounded-md shimmer" />
                <div className="h-4 w-16 rounded-md shimmer" />
              </div>

              <div className="space-y-3 pb-5 border-b border-slate-100">
                <div className="h-4 w-36 rounded-md shimmer" />
                <div className="space-y-2">
                  <div className="h-8 rounded-xl shimmer" />
                  <div className="h-8 rounded-xl shimmer" />
                  <div className="h-8 rounded-xl shimmer" />
                  <div className="h-8 rounded-xl shimmer" />
                  <div className="h-8 rounded-xl shimmer" />
                </div>
              </div>

              <div className="space-y-3 pb-5 border-b border-slate-100">
                <div className="h-4 w-28 rounded-md shimmer" />
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 rounded-lg shimmer" />
                  ))}
                </div>
              </div>

              <div className="space-y-3 pb-5 border-b border-slate-100">
                <div className="flex justify-between">
                  <div className="h-4 w-24 rounded-md shimmer" />
                  <div className="h-4 w-16 rounded-md shimmer" />
                </div>
                <div className="h-2 rounded-full shimmer" />
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="h-7 rounded-lg shimmer" />
                  <div className="h-7 rounded-lg shimmer" />
                  <div className="h-7 rounded-lg shimmer" />
                  <div className="h-7 rounded-lg shimmer" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-4 w-32 rounded-md shimmer" />
                <div className="h-10 rounded-xl shimmer" />
              </div>
            </div>
          </aside>

          {/* Right: Results Column Skeleton */}
          <div className="flex-1 space-y-5">
            <div className="rounded-2xl border border-slate-200/90 bg-white px-5 py-3.5 shadow-2xs flex items-center justify-between">
              <div className="h-5 w-44 rounded-md shimmer" />
              <div className="h-8 w-36 rounded-xl shimmer" />
            </div>

            <div className="flex flex-col gap-5 sm:gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <PropertyCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ================================================================
   WRAPPERS (Client-side URL Synchronization & Suspense boundary)
================================================================ */

function BuyPageWrapper() {
  const searchParams = useSearchParams();
  return <BuyPageContent key={searchParams.toString()} />;
}

export default function BuyPage() {
  return (
    <Suspense fallback={<BuyPageSkeleton />}>
      <BuyPageWrapper />
    </Suspense>
  );
}