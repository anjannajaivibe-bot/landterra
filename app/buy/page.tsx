'use client';

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ShieldCheck,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
  BadgeCheck,
  LandPlot,
  Check,
  Sparkles,
  Home as HomeIcon,
} from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { DueDiligenceChecklist } from '@/components/legal/DueDiligenceChecklist';
import { IProperty } from '@/types/property';
import { LAND_TYPES, INDIAN_STATES } from '@/config/constants';

/* ================================================================
   CONSTANTS
================================================================ */

const DEFAULT_MAX_PRICE = 100000000; // 10 Cr
const DEFAULT_MAX_AREA = 10000;
const RESULTS_PER_PAGE = 9;

const QUICK_BUDGET_CHIPS = [
  { label: 'Any Budget', max: DEFAULT_MAX_PRICE },
  { label: '< ₹25 Lakhs', max: 2500000 },
  { label: '< ₹50 Lakhs', max: 5000000 },
  { label: '< ₹1 Crore', max: 10000000 },
  { label: '< ₹5 Crores', max: 50000000 },
  { label: '< ₹10 Crores', max: 100000000 },
];

const QUICK_AREA_CHIPS = [
  { label: 'Any Area', max: DEFAULT_MAX_AREA },
  { label: '< 300 sq.yd', max: 300 },
  { label: '< 600 sq.yd', max: 600 },
  { label: '< 1,500 sq.yd', max: 1500 },
  { label: '< 5,000 sq.yd', max: 5000 },
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
     FILTER STATE
  --------------------------------------------------------------- */

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('query') || searchParams.get('city') || '',
  );

  const [selectedLandType, setSelectedLandType] = useState(
    searchParams.get('landType') || 'ALL',
  );

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

  /* ---------------------------------------------------------------
     DATA STATE
  --------------------------------------------------------------- */

  const [properties, setProperties] = useState<IProperty[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  /* ---------------------------------------------------------------
     ACTIVE FILTER COUNT
  --------------------------------------------------------------- */

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedLandType !== 'ALL') count++;
    if (selectedState !== 'ALL') count++;
    if (verifiedOnly) count++;
    if (minPrice > 0) count++;
    if (maxPrice < DEFAULT_MAX_PRICE) count++;
    if (minArea > 0) count++;
    if (maxArea < DEFAULT_MAX_AREA) count++;
    return count;
  }, [
    searchQuery,
    selectedLandType,
    selectedState,
    verifiedOnly,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
  ]);

  /* ================================================================
     FETCH PROPERTIES
  ================================================================= */

  const loadProperties = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      if (searchQuery.trim()) {
        params.set('query', searchQuery.trim());
        params.set('city', searchQuery.trim());
      }

      if (selectedLandType !== 'ALL') {
        params.set('landType', selectedLandType);
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
        throw new Error('Unable to load land listings.');
      }

      const data = await response.json();

      setProperties(Array.isArray(data?.data) ? data.data : []);
      setTotalCount(Number(data?.total) || 0);
      setTotalPages(Math.max(Number(data?.totalPages) || 1, 1));
    } catch (err) {
      console.error('Marketplace loading error:', err);
      setProperties([]);
      setTotalCount(0);
      setTotalPages(1);
      setError('We could not load the land listings right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedLandType,
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
     INITIAL / FILTERED DATA LOAD
  ================================================================= */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setError('');
      setLoading(true);

      try {
        const params = new URLSearchParams();

        if (searchQuery.trim()) {
          params.set('query', searchQuery.trim());
          params.set('city', searchQuery.trim());
        }

        if (selectedLandType !== 'ALL') {
          params.set('landType', selectedLandType);
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
          throw new Error('Unable to load land listings.');
        }

        const data = await response.json();

        if (cancelled) return;

        setProperties(Array.isArray(data?.data) ? data.data : []);
        setTotalCount(Number(data?.total) || 0);
        setTotalPages(Math.max(Number(data?.totalPages) || 1, 1));
        setError('');
      } catch (err) {
        if (cancelled) return;
        console.error('Marketplace loading error:', err);
        setProperties([]);
        setTotalCount(0);
        setTotalPages(1);
        setError('We could not load the land listings right now. Please try again.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    searchQuery,
    selectedLandType,
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
     RESET FILTERS
  ================================================================= */

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLandType('ALL');
    setSelectedState('ALL');
    setVerifiedOnly(false);
    setMinPrice(0);
    setMaxPrice(DEFAULT_MAX_PRICE);
    setMinArea(0);
    setMaxArea(DEFAULT_MAX_AREA);
    setSortBy('newest');
    setPage(1);
  };

  /* ================================================================
     SEARCH
  ================================================================= */

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
  };

  /* ================================================================
     FILTER UPDATE HELPERS
  ================================================================= */

  const updateLandType = (value: string) => {
    setSelectedLandType(value);
    setPage(1);
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

  /* ================================================================
     RENDER
  ================================================================= */

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900">
      <Navbar />

      {/* Hero Search Section - Indian Deep Saffron & Crisp White */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-[#fffaf4] via-white to-[#fbfcfe] pt-7 pb-8 sm:pt-10 sm:pb-11">
        {/* Subtle decorative saffron glow */}
        <div className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-[#FF9933]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-[#FF9933]/05 blur-2xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb & Trust Tag */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-slate-500 font-medium">
              <Link href="/" className="transition-colors hover:text-[#c75e0a] flex items-center gap-1">
                <HomeIcon className="w-3.5 h-3.5 text-[#FF9933]" />
                <span>Home</span>
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-bold">Land & Plots Marketplace</span>
            </nav>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FF9933]/30 bg-[#fff1dc] px-3 py-1 text-[11px] font-black text-[#c75e0a] shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-[#FF9933]" />
              <span>Direct From Owners • 0% Brokerage</span>
            </div>
          </div>

          {/* Heading */}
          <div className="max-w-3xl">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-4xl">
              Direct Land & Plots{' '}
              <span className="text-[#FF9933]">Marketplace</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
              Browse direct landowner residential layouts, commercial parcels, and farmlands across India with zero broker commissions and direct seller contact.
            </p>
          </div>

          {/* Search Omnibar */}
          <form onSubmit={handleSearchSubmit} className="mt-6 max-w-4xl">
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center rounded-2xl sm:rounded-full bg-white border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-2 transition-all focus-within:border-[#FF9933]/50 focus-within:shadow-[0_12px_35px_rgba(255,153,51,0.12)] gap-2 sm:gap-0">
              <div className="flex-1 flex items-center px-3.5 py-1.5">
                <MapPin className="h-4 w-4 text-[#FF9933] shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Enter city, locality, district, or project e.g. Kokapet, Visakhapatnam..."
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
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-full bg-[#FF9933] hover:bg-[#f07d12] px-7 py-3 text-xs sm:text-sm font-black text-white shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Search className="h-4 w-4" />
                <span>Search Land</span>
              </button>
            </div>
          </form>

          {/* Quick Category Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Popular:</span>
            <button
              type="button"
              onClick={() => updateLandType('ALL')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                selectedLandType === 'ALL'
                  ? 'bg-[#FF9933] border-[#FF9933] text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#FF9933]/50 hover:bg-[#fffbf5]'
              }`}
            >
              All Land
            </button>

            {LAND_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => updateLandType(type.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                  selectedLandType === type.value
                    ? 'bg-[#FF9933] border-[#FF9933] text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-[#FF9933]/50 hover:bg-[#fffbf5]'
                }`}
              >
                {type.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:col-span-3 lg:block">
            <FilterPanel
              selectedLandType={selectedLandType}
              selectedState={selectedState}
              verifiedOnly={verifiedOnly}
              maxPrice={maxPrice}
              maxArea={maxArea}
              activeFilterCount={activeFilterCount}
              onLandTypeChange={updateLandType}
              onStateChange={updateState}
              onVerifiedChange={updateVerified}
              onMaxPriceChange={(value) => {
                setMaxPrice(value);
                setPage(1);
              }}
              onMaxAreaChange={(value) => {
                setMaxArea(value);
                setPage(1);
              }}
              onReset={handleResetFilters}
            />
          </aside>

          {/* Listings Section */}
          <section className="lg:col-span-9">
            {/* Results Toolbar */}
            <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-white border border-slate-200/80 p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">
                    Available Land Listings
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
                    : 'Showing verified direct-from-owner land records'}
                </p>
              </div>

              {/* Right Controls: Mobile Filter Button & Sort Dropdown */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 lg:hidden cursor-pointer"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#FF9933]" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF9933] px-1 text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

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

                {selectedLandType !== 'ALL' && (
                  <FilterChip
                    label={
                      (LAND_TYPES as readonly { value: string; label: string }[]).find(
                        (type) => type.value === selectedLandType
                      )?.label || selectedLandType
                    }
                    onRemove={() => updateLandType('ALL')}
                  />
                )}

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
                  onClick={loadProperties}
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
                  No Land Listings Match This Criteria
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500 font-medium">
                  There are currently no land parcels matching your exact filters. Try expanding your search location, adjusting your budget range, or clearing active filters.
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
                    <span>+ List Your Land Here</span>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Classifieds Marketplace Notice & Due Diligence Advisory */}
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#FF9933]/30 bg-[#fff9f0] p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#FF9933]" />
                  <div>
                    <p className="text-xs font-bold text-[#c75e0a]">
                      Classifieds Marketplace Notice (0% Brokerage)
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#7a3705] leading-relaxed">
                      LandTerra / BhoomiMitra is an open classifieds advertising portal connecting buyers and sellers directly. We do not verify land titles. Buyers are required to inspect original registered sale deeds, EC Form 15, Pahani, and survey maps before executing transactions.
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

                {/* Full Land Buyer's Due Diligence Checklist */}
                <div className="mt-12">
                  <DueDiligenceChecklist />
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* Mobile Slide-Over Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileFilterOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          <div className="absolute right-0 top-0 flex h-full w-[min(90%,380px)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Filter Land Listings
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                  Select your exact property specifications
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <FilterPanel
                mobile
                selectedLandType={selectedLandType}
                selectedState={selectedState}
                verifiedOnly={verifiedOnly}
                maxPrice={maxPrice}
                maxArea={maxArea}
                activeFilterCount={activeFilterCount}
                onLandTypeChange={updateLandType}
                onStateChange={updateState}
                onVerifiedChange={updateVerified}
                onMaxPriceChange={(value) => {
                  setMaxPrice(value);
                  setPage(1);
                }}
                onMaxAreaChange={(value) => {
                  setMaxArea(value);
                  setPage(1);
                }}
                onReset={handleResetFilters}
              />
            </div>

            <div className="border-t border-slate-100 bg-white p-4">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full rounded-2xl bg-[#FF9933] hover:bg-[#f07d12] py-3.5 text-xs font-black text-white shadow-sm cursor-pointer"
              >
                Show Results ({totalCount})
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

/* ================================================================
   FILTER PANEL COMPONENT
================================================================ */

function FilterPanel({
  selectedLandType,
  selectedState,
  verifiedOnly,
  maxPrice,
  maxArea,
  activeFilterCount,
  onLandTypeChange,
  onStateChange,
  onVerifiedChange,
  onMaxPriceChange,
  onMaxAreaChange,
  onReset,
  mobile = false,
}: {
  selectedLandType: string;
  selectedState: string;
  verifiedOnly: boolean;
  maxPrice: number;
  maxArea: number;
  activeFilterCount: number;
  onLandTypeChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onVerifiedChange: (value: boolean) => void;
  onMaxPriceChange: (value: number) => void;
  onMaxAreaChange: (value: number) => void;
  onReset: () => void;
  mobile?: boolean;
}) {
  return (
    <div
      className={
        mobile
          ? 'space-y-6'
          : 'sticky top-24 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 space-y-6'
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
            <SlidersHorizontal className="h-4 w-4 text-[#FF9933]" />
            <span>Search Filters</span>
          </h2>
          {activeFilterCount > 0 && (
            <p className="mt-0.5 text-[11px] font-bold text-[#c75e0a]">
              {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}
            </p>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] font-black text-[#c75e0a] hover:underline cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Reset All
          </button>
        )}
      </div>

      {/* Land Buyer's Due Diligence Checklist */}
      <DueDiligenceChecklist compact />

      {/* Land Type Filter */}
      <FilterSection title="Land / Plot Category">
        <div className="space-y-1">
          <FilterRadio
            label="All Land Types"
            checked={selectedLandType === 'ALL'}
            onChange={() => onLandTypeChange('ALL')}
          />
          {LAND_TYPES.map((type) => (
            <FilterRadio
              key={type.value}
              label={type.label}
              checked={selectedLandType === type.value}
              onChange={() => onLandTypeChange(type.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Geographic State */}
      <FilterSection title="Geographic Region / State">
        <div className="relative">
          <MapPin className="w-3.5 h-3.5 text-[#FF9933] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedState}
            onChange={(event) => onStateChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-colors focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20 cursor-pointer"
          >
            <option value="ALL">All India (Any State)</option>
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </FilterSection>

      {/* Budget Slider */}
      <FilterSection title="Maximum Budget">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">Cap:</span>
          <span className="text-xs font-black text-[#c75e0a] bg-[#fff1dc] px-2 py-0.5 rounded-md">
            {maxPrice >= DEFAULT_MAX_PRICE ? 'Up to ₹10 Cr+' : formatIndianCurrency(maxPrice)}
          </span>
        </div>

        <input
          type="range"
          min={500000}
          max={DEFAULT_MAX_PRICE}
          step={500000}
          value={maxPrice}
          onChange={(event) => onMaxPriceChange(Number(event.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#FF9933]"
        />

        <div className="mt-1.5 flex justify-between text-[10px] font-bold text-slate-400">
          <span>₹5 L</span>
          <span>₹10 Cr+</span>
        </div>

        {/* Quick Budget Chips */}
        <div className="mt-2.5 flex flex-wrap gap-1">
          {QUICK_BUDGET_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onMaxPriceChange(chip.max)}
              className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                maxPrice === chip.max
                  ? 'bg-[#fff1dc] text-[#c75e0a] border-[#FF9933]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Land Area Slider */}
      <FilterSection title="Maximum Land Area">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">Cap:</span>
          <span className="text-xs font-black text-[#c75e0a] bg-[#fff1dc] px-2 py-0.5 rounded-md">
            {maxArea >= DEFAULT_MAX_AREA ? '10,000+ sq.yd' : formatArea(maxArea)}
          </span>
        </div>

        <input
          type="range"
          min={100}
          max={DEFAULT_MAX_AREA}
          step={100}
          value={maxArea}
          onChange={(event) => onMaxAreaChange(Number(event.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#FF9933]"
        />

        <div className="mt-1.5 flex justify-between text-[10px] font-bold text-slate-400">
          <span>100 sq.yd</span>
          <span>10,000+ sq.yd</span>
        </div>

        {/* Quick Area Chips */}
        <div className="mt-2.5 flex flex-wrap gap-1">
          {QUICK_AREA_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onMaxAreaChange(chip.max)}
              className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                maxArea === chip.max
                  ? 'bg-[#fff1dc] text-[#c75e0a] border-[#FF9933]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Trust Callout */}
      {!mobile && (
        <div className="rounded-2xl border border-slate-100 bg-[#fffdf9] p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fff1dc]">
              <ShieldCheck className="h-4 w-4 text-[#FF9933]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">
                0% Brokerage Guarantee
              </p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500 font-medium">
                Every listing connects you straight to the owner or authorized developer.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 pb-5 last:border-0">
      <h3 className="mb-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FilterRadio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
        checked
          ? 'bg-[#fff1dc] text-[#c75e0a] border border-[#FF9933]/40'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <input
          type="radio"
          name="land-type"
          checked={checked}
          onChange={onChange}
          className="h-3.5 w-3.5 border-slate-300 text-[#FF9933] focus:ring-[#FF9933] accent-[#FF9933] cursor-pointer"
        />
        <span>{label}</span>
      </div>
      {checked && <Check className="w-3.5 h-3.5 text-[#FF9933]" />}
    </label>
  );
}

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

function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xs flex flex-col md:flex-row">
      <div className="w-full md:w-[320px] lg:w-[360px] xl:w-[380px] aspect-[16/10] md:aspect-auto min-h-[220px] md:min-h-[260px] shrink-0 animate-pulse bg-slate-200/70" />
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 animate-pulse rounded-full bg-slate-200/60" />
            <div className="h-7 w-32 animate-pulse rounded-xl bg-slate-200/70" />
          </div>
          <div className="h-6 w-3/4 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-4 w-1/2 animate-pulse rounded-md bg-slate-200/50" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 p-3">
          <div className="h-10 animate-pulse rounded-xl bg-slate-200/50" />
          <div className="h-10 animate-pulse rounded-xl bg-slate-200/50" />
          <div className="h-10 animate-pulse rounded-xl bg-slate-200/50 col-span-2 sm:col-span-1" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="h-4 w-36 animate-pulse rounded-md bg-slate-200/50" />
          <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-200/60" />
        </div>
      </div>
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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#FF9933]" />
            <p className="text-xs font-semibold text-slate-500">
              Loading available land...
            </p>
          </div>
        </div>
      }
    >
      <BuyPageWrapper />
    </Suspense>
  );
}