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
} from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { IProperty } from '@/types/property';
import { LAND_TYPES, INDIAN_STATES } from '@/config/constants';

/* ================================================================
   CONSTANTS
================================================================ */

const DEFAULT_MAX_PRICE = 100000000;
const DEFAULT_MAX_AREA = 10000;
const RESULTS_PER_PAGE = 9;

/* ================================================================
   HELPERS
================================================================ */

function formatIndianCurrency(value: number) {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(
      value % 10000000 === 0 ? 0 : 1,
    )} Cr`;
  }

  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(
      value % 100000 === 0 ? 0 : 1,
    )} L`;
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
    searchParams.get('query') ||
      searchParams.get('city') ||
      '',
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

      const response = await fetch(
        `/api/properties?${params.toString()}`,
        {
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw new Error('Unable to load land listings.');
      }

      const data = await response.json();

      setProperties(
        Array.isArray(data?.data) ? data.data : [],
      );

      setTotalCount(Number(data?.total) || 0);

      setTotalPages(
        Math.max(Number(data?.totalPages) || 1, 1),
      );
    } catch (err) {
      console.error('Marketplace loading error:', err);

      setProperties([]);
      setTotalCount(0);
      setTotalPages(1);

      setError(
        'We could not load the land listings right now. Please try again.',
      );
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

        const response = await fetch(
          `/api/properties?${params.toString()}`,
          {
            cache: 'no-store',
          },
        );

        if (!response.ok) {
          throw new Error('Unable to load land listings.');
        }

        const data = await response.json();

        if (cancelled) return;

        setProperties(
          Array.isArray(data?.data) ? data.data : [],
        );

        setTotalCount(Number(data?.total) || 0);

        setTotalPages(
          Math.max(Number(data?.totalPages) || 1, 1),
        );

        setError('');
      } catch (err) {
        if (cancelled) return;

        console.error('Marketplace loading error:', err);

        setProperties([]);
        setTotalCount(0);
        setTotalPages(1);

        setError(
          'We could not load the land listings right now. Please try again.',
        );
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

  const handleSearchSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.16),transparent_38%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mb-5 flex items-center gap-2 text-[11px] text-slate-400">
            <Link
              href="/"
              className="transition-colors hover:text-white"
            >
              Home
            </Link>

            <span>/</span>

            <span className="text-slate-300">
              Find Land
            </span>
          </div>

          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
              <LandPlot className="h-3.5 w-3.5" />
              Find land that fits your requirement
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Find the right land.
              <span className="block text-emerald-400">
                Without the noise.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Search land listings by location, type, size and budget.
              Open a listing to review its available property information
              and connect with the seller.
            </p>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="mt-7 max-w-4xl"
          >
            <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by city, district, state or location..."
                  className="h-12 w-full rounded-xl border-0 bg-white pl-12 pr-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
              >
                <Search className="h-4 w-4" />
                Search Land
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {LAND_TYPES.slice(0, 4).map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => updateLandType(type.value)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  selectedLandType === type.value
                    ? 'border-emerald-400 bg-emerald-500 text-white'
                    : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
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

          <section className="lg:col-span-9">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-950">
                    Land for sale
                  </h2>

                  {!loading && (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {totalCount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {activeFilterCount > 0
                    ? `${activeFilterCount} filter${
                        activeFilterCount === 1 ? '' : 's'
                      } applied`
                    : 'Browse all currently available listings'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters

                  {activeFilterCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />

                  <label
                    htmlFor="sort"
                    className="sr-only"
                  >
                    Sort listings
                  </label>

                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(event) =>
                      updateSort(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="newest">Newest</option>
                    <option value="price_asc">
                      Price: Low to High
                    </option>
                    <option value="price_desc">
                      Price: High to Low
                    </option>
                    <option value="area_asc">
                      Area: Small to Large
                    </option>
                    <option value="area_desc">
                      Area: Large to Small
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  Active:
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
                      LAND_TYPES.find(
                        (type) =>
                          type.value === selectedLandType,
                      )?.label || selectedLandType
                    }
                    onRemove={() => updateLandType('ALL')}
                  />
                )}

                {selectedState !== 'ALL' && (
                  <FilterChip
                    label={selectedState}
                    onRemove={() => updateState('ALL')}
                  />
                )}

                {verifiedOnly && (
                  <FilterChip
                    label="Verified only"
                    onRemove={() => updateVerified(false)}
                  />
                )}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="ml-1 text-[11px] font-bold text-slate-500 underline underline-offset-2 hover:text-emerald-700"
                >
                  Clear all
                </button>
              </div>
            )}

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-white p-10 text-center">
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
                  className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <PropertyCardSkeleton key={index} />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Search className="h-7 w-7" />
                </div>

                <h3 className="text-lg font-black text-slate-900">
                  No land matches your search
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Try a different location or remove some filters.
                  There may be more properties available outside your
                  current criteria.
                </p>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Search & Filters
                </button>
              </div>
            ) : (
              <>
                {verifiedOnly && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                    <div>
                      <p className="text-xs font-bold text-emerald-900">
                        Showing verified listings
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-emerald-800">
                        These listings have been marked as verified
                        through LandTerra&apos;s internal review process.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property._id}
                      property={property}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row">
                    <p className="text-[11px] text-slate-500">
                      Page{' '}
                      <strong className="text-slate-900">
                        {page}
                      </strong>{' '}
                      of{' '}
                      <strong className="text-slate-900">
                        {totalPages}
                      </strong>
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() =>
                          setPage((current) =>
                            Math.max(current - 1, 1),
                          )
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </button>

                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() =>
                          setPage((current) =>
                            Math.min(
                              current + 1,
                              totalPages,
                            ),
                          )
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileFilterOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          <div className="absolute right-0 top-0 flex h-full w-[min(90%,380px)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Filters
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-500">
                  Narrow down the land you want
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
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

            <div className="border-t border-slate-200 bg-white p-4">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full rounded-xl bg-emerald-600 py-3.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Show Results
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
   FILTER PANEL
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
          ? 'space-y-7'
          : 'sticky top-24 space-y-5'
      }
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
            <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
            Filters
          </h2>

          {activeFilterCount > 0 && (
            <p className="mt-1 text-[10px] text-slate-500">
              {activeFilterCount} active
            </p>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-emerald-700"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      <label className="block cursor-pointer rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(event) =>
              onVerifiedChange(event.target.checked)
            }
            className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
          />

          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
              <BadgeCheck className="h-4 w-4 text-emerald-700" />
              Verified listings only
            </div>

            <p className="mt-1 text-[10px] leading-4 text-emerald-800">
              Only show listings marked as verified by LandTerra.
            </p>
          </div>
        </div>
      </label>

      <FilterSection title="Land type">
        <div className="space-y-1">
          <FilterRadio
            label="All land types"
            checked={selectedLandType === 'ALL'}
            onChange={() => onLandTypeChange('ALL')}
          />

          {LAND_TYPES.map((type) => (
            <FilterRadio
              key={type.value}
              label={type.label}
              checked={selectedLandType === type.value}
              onChange={() =>
                onLandTypeChange(type.value)
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Location">
        <select
          value={selectedState}
          onChange={(event) =>
            onStateChange(event.target.value)
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="ALL">All India</option>

          {INDIAN_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </FilterSection>

      <FilterSection title="Maximum budget">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Budget
          </span>

          <span className="text-xs font-black text-emerald-700">
            {maxPrice >= DEFAULT_MAX_PRICE
              ? 'Any budget'
              : formatIndianCurrency(maxPrice)}
          </span>
        </div>

        <input
          type="range"
          min={500000}
          max={DEFAULT_MAX_PRICE}
          step={500000}
          value={maxPrice}
          onChange={(event) =>
            onMaxPriceChange(Number(event.target.value))
          }
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600"
        />

        <div className="mt-2 flex justify-between text-[9px] text-slate-400">
          <span>₹5 L</span>
          <span>₹10 Cr+</span>
        </div>
      </FilterSection>

      <FilterSection title="Maximum land area">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Area
          </span>

          <span className="text-xs font-black text-emerald-700">
            {maxArea >= DEFAULT_MAX_AREA
              ? 'Any area'
              : formatArea(maxArea)}
          </span>
        </div>

        <input
          type="range"
          min={100}
          max={DEFAULT_MAX_AREA}
          step={100}
          value={maxArea}
          onChange={(event) =>
            onMaxAreaChange(Number(event.target.value))
          }
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600"
        />

        <div className="mt-2 flex justify-between text-[9px] text-slate-400">
          <span>100 sq.yd</span>
          <span>10,000+ sq.yd</span>
        </div>
      </FilterSection>

      {!mobile && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <ShieldCheck className="h-4 w-4 text-slate-600" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900">
                Shop with context
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                Open each listing to review its available property,
                location and verification information before contacting
                the seller.
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
      <h3 className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
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
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
      <input
        type="radio"
        name="land-type"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />

      <span>{label}</span>
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
      className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="truncate">{label}</span>

      <X className="h-3 w-3 shrink-0 text-slate-400" />
    </button>
  );
}

function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="aspect-[4/3] animate-pulse bg-slate-200" />

      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />

        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />

        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
        </div>

        <div className="h-10 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function BuyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />

            <p className="text-xs font-semibold text-slate-500">
              Loading available land...
            </p>
          </div>
        </div>
      }
    >
      <BuyPageContent />
    </Suspense>
  );
}