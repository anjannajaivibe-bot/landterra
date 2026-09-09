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
  RotateCcw,
  ShieldCheck,
  X,
  ArrowUpDown,
  LandPlot,
  Sparkles,
  Home as HomeIcon,
} from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { IProperty } from '@/types/property';
import {
  DEFAULT_MAX_PRICE,
  DEFAULT_MAX_AREA,
  RESULTS_PER_PAGE,
  BUDGET_PRESETS,
  AREA_PRESETS,
  RESIDENTIAL_TYPES_SUPPORTING_BHK,
} from '@/components/buy/types';
import { FilterBar } from '@/components/buy/FilterBar';
import { ActiveFilterBadges } from '@/components/buy/ActiveFilterBadges';
import { PropertyPagination } from '@/components/buy/PropertyPagination';
import {
  PropertyCardSkeleton,
  BuyPageSkeleton,
} from '@/components/buy/BuySkeletons';

export interface BuyPageClientProps {
  initialProperties?: IProperty[];
  initialTotal?: number;
  initialTotalPages?: number;
  footer?: React.ReactNode;
  dueDiligence?: React.ReactNode;
}

/* ================================================================
   PAGE CONTENT
================================================================ */

function BuyPageContent({
  initialProperties,
  initialTotal,
  initialTotalPages,
  footer,
  dueDiligence,
}: BuyPageClientProps) {
  const searchParams = useSearchParams();

  /* ---------------------------------------------------------------
     FILTER STATE (Initialized from Home Page URL query parameters)
  --------------------------------------------------------------- */

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('query') || searchParams.get('city') || '',
  );
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  // 350ms search input debouncing to prevent network spam while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Client-side cache across filter switches (e.g. Farmlands -> Villas -> Farmlands = 0ms instant)
  const clientCacheRef = useRef<
    Map<string, { data: IProperty[]; total: number; totalPages: number }>
  >(new Map());

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

  const handleTogglePropertyType = (id: string) => {
    setSelectedPropertyTypes((prev) => {
      const next = prev.includes(id)
        ? prev.filter((t) => t !== id)
        : [...prev, id];

      // If no residential unit is selected, clear BHKs
      if (!next.some((t) => RESIDENTIAL_TYPES_SUPPORTING_BHK.includes(t))) {
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

  const [properties, setProperties] = useState<IProperty[]>(initialProperties || []);
  const [totalCount, setTotalCount] = useState(initialTotal ?? (initialProperties?.length || 0));
  const [totalPages, setTotalPages] = useState(initialTotalPages ?? 1);

  const [loading, setLoading] = useState(!initialProperties || initialProperties.length === 0);
  const [error, setError] = useState('');

  const isInitialMount = useRef(true);

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

  /* ================================================================
     FETCH PROPERTIES
  ================================================================= */

  useEffect(() => {
    let cancelled = false;

    const trimmedQuery = debouncedSearchQuery.trim();
    // Only search when at least 3 characters are entered (Option C)
    const effectiveQuery = trimmedQuery.length >= 3 ? trimmedQuery : '';

    const cacheKey = JSON.stringify({
      q: effectiveQuery,
      types: [...selectedPropertyTypes].sort(),
      bhks: [...selectedBhks].sort(),
      state: selectedState,
      verified: verifiedOnly,
      minP: minPrice,
      maxP: maxPrice,
      minA: minArea,
      maxA: maxArea,
      sort: sortBy,
      p: page,
    });

    // Skip redundant network fetch on initial mount if server already preloaded properties
    // Also seed client cache so switching away and back to initial state renders at 0ms
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialProperties && initialProperties.length > 0) {
        clientCacheRef.current.set(cacheKey, {
          data: initialProperties,
          total: initialTotal ?? initialProperties.length,
          totalPages: initialTotalPages ?? 1,
        });
        return;
      }
    }

    const fetchProperties = async () => {
      // 0ms instant render if this filter combination was previously loaded in this session
      const cached = clientCacheRef.current.get(cacheKey);
      if (cached) {
        setProperties(cached.data);
        setTotalCount(cached.total);
        setTotalPages(cached.totalPages);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();

        if (effectiveQuery) {
          params.set('query', effectiveQuery);
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
        params.set('cardOnly', 'true');

        const response = await fetch(`/api/properties?${params.toString()}`);
        const result = await response.json();

        if (!cancelled) {
          if (response.ok && Array.isArray(result?.data)) {
            const data = result.data || [];
            const total = result.total ?? result.pagination?.total ?? data.length;
            const pages = result.totalPages ?? result.pagination?.pages ?? 1;

            setProperties(data);
            setTotalCount(total);
            setTotalPages(pages);

            // Cache filter result for instant back-and-forth navigation
            clientCacheRef.current.set(cacheKey, {
              data,
              total,
              totalPages: pages,
            });
          } else {
            setError(result?.error || 'Failed to load properties');
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'An error occurred while loading properties',
          );
        }
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
    debouncedSearchQuery,
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
    initialProperties,
    initialTotal,
    initialTotalPages,
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
              <span>Direct From Owners ΓÇó 0% Brokerage</span>
            </div>
          </div>

          {/* Heading */}
          <div className="max-w-3xl">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-4xl">
              Direct Real Estate &amp; Properties{' '}
              <span className="text-[#FF9933]">Marketplace</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
              Browse direct owner properties ΓÇö plots, apartments, houses, villas, commercial spaces, and farmlands across India with zero broker commissions.
            </p>
          </div>

          {/* Modular Search & Filter Controls */}
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={(val) => {
              setSearchQuery(val);
              setPage(1);
            }}
            onSearchSubmit={handleSearchSubmit}
            selectedPropertyTypes={selectedPropertyTypes}
            selectedBhks={selectedBhks}
            onTogglePropertyType={handleTogglePropertyType}
            onToggleBhk={handleToggleBhk}
            onClearPropertyTypes={() => {
              setSelectedPropertyTypes([]);
              setSelectedBhks([]);
              setPage(1);
            }}
            selectedState={selectedState}
            onStateChange={updateState}
            selectedBudgetIndex={selectedBudgetIndex}
            onBudgetPresetChange={handleBudgetPresetChange}
            selectedAreaIndex={selectedAreaIndex}
            onAreaPresetChange={handleAreaPresetChange}
            verifiedOnly={verifiedOnly}
            onToggleVerified={updateVerified}
          />

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

      {/* Main Content Layout */}
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
                  name="sortBy"
                  aria-label="Sort properties"
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

          {/* Modular Active Filter Badges */}
          <ActiveFilterBadges
            searchQuery={searchQuery}
            selectedPropertyTypes={selectedPropertyTypes}
            selectedBhks={selectedBhks}
            selectedState={selectedState}
            verifiedOnly={verifiedOnly}
            minPrice={minPrice}
            maxPrice={maxPrice}
            minArea={minArea}
            maxArea={maxArea}
            onClearQuery={() => {
              setSearchQuery('');
              setPage(1);
            }}
            onTogglePropertyType={handleTogglePropertyType}
            onToggleBhk={handleToggleBhk}
            onClearState={() => updateState('ALL')}
            onToggleVerified={updateVerified}
            onResetPrice={() => {
              setMaxPrice(DEFAULT_MAX_PRICE);
              setPage(1);
            }}
            onResetArea={() => {
              setMaxArea(DEFAULT_MAX_AREA);
              setPage(1);
            }}
            onResetAll={handleResetFilters}
          />

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
                  prefetch={false}
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
                  <PropertyCard
                    key={property._id}
                    property={property}
                    priority={false}
                  />
                ))}
              </div>

              {/* Modular Pagination */}
              <PropertyPagination
                page={page}
                totalPages={totalPages}
                onPageChange={(newPage) => setPage(newPage)}
              />

              {/* Buyer Due Diligence Advisory Guide at Bottom of Marketplace */}
              {dueDiligence && (
                <div className="mt-12">
                  {dueDiligence}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {footer}
    </div>
  );
}

/* ================================================================
   WRAPPERS (Client-side URL Synchronization & Suspense boundary)
================================================================ */

export function BuyPageClient({
  initialProperties,
  initialTotal,
  initialTotalPages,
  footer,
  dueDiligence,
}: BuyPageClientProps) {
  return (
    <BuyPageContent
      initialProperties={initialProperties}
      initialTotal={initialTotal}
      initialTotalPages={initialTotalPages}
      footer={footer}
      dueDiligence={dueDiligence}
    />
  );
}

export default BuyPageClient;
