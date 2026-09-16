'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  ShieldCheck,
  Phone,
  ArrowRight,
  Sparkles,
  Layers,
  LandPlot,
  Building2,
  Tractor,
  Trees,
  FileText,
  BadgeCheck,
  ChevronRight,
  ChevronDown,
  Check,
  Tag,
  HeartHandshake,
  CheckCircle2,
  Lock,
  Home,
  Scale,
} from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { PropertyCard } from '@/components/properties/PropertyCard';
import dynamic from 'next/dynamic';
import { IProperty } from '@/types/property';
import { IUser } from '@/types/user';

const LandAreaConverter = dynamic(
  () => import('@/components/tools/LandAreaConverter').then((mod) => mod.LandAreaConverter),
  { ssr: true }
);

const DueDiligenceChecklist = dynamic(
  () => import('@/components/legal/DueDiligenceChecklist').then((mod) => mod.DueDiligenceChecklist),
  { ssr: true }
);

const AuthModal = dynamic(
  () => import('@/components/auth/AuthModal').then((mod) => mod.AuthModal),
  { ssr: false }
);

/* ================================================================
   HERO SEARCH CONFIG
================================================================ */

interface LandTypeOption {
  id: string;
  label: string;
  category:
    | 'Land & Plots'
    | 'Residential Units'
    | 'Commercial & Retail'
    | 'Hospitality & Leisure'
    | 'Income-Generating & Rentals';
}

const HERO_LAND_TYPES: LandTypeOption[] = [
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

const BUDGET_PRESETS = [
  { label: 'Any Budget', minPrice: 0, maxPrice: 0 },
  { label: 'Under ₹25 Lakhs', minPrice: 0, maxPrice: 2500000 },
  { label: '₹25L – ₹50 Lakhs', minPrice: 2500000, maxPrice: 5000000 },
  { label: '₹50L – ₹1 Crore', minPrice: 5000000, maxPrice: 10000000 },
  { label: '₹1 Cr – ₹3 Crores', minPrice: 10000000, maxPrice: 30000000 },
  { label: '₹3 Cr – ₹5 Crores', minPrice: 30000000, maxPrice: 50000000 },
  { label: '₹5 Cr – ₹10 Crores', minPrice: 50000000, maxPrice: 100000000 },
  { label: 'Above ₹10 Crores', minPrice: 100000000, maxPrice: 0 },
];

const POPULAR_SEARCH_TAGS = [
  { label: 'Kokapet Plots', query: 'Kokapet' },
  { label: 'Moinabad Farmlands', query: 'Moinabad' },
  { label: 'Shamshabad Airport Zone', query: 'Shamshabad' },
  { label: 'Shankarpally Plots', query: 'Shankarpally' },
  { label: 'Vijayawada Highway', query: 'Vijayawada Highway' },
  { label: 'Bengaluru Rural', query: 'Bengaluru Rural' },
];

export interface HomePageClientProps {
  initialProperties?: IProperty[];
  initialListingFee?: number;
  initialListingDurationDays?: number;
  footer?: React.ReactNode;
}

export function HomePageClient({
  initialProperties = [],
  initialListingFee = 10,
  initialListingDurationDays = 30,
  footer,
}: HomePageClientProps) {
  const [properties, setProperties] = useState<IProperty[]>(initialProperties);
  const [loading, setLoading] = useState(!initialProperties || initialProperties.length === 0);

  /* Platform settings */
  const [publicListingFee, setPublicListingFee] = useState(initialListingFee);
  const [listingDurationDays, setListingDurationDays] = useState(initialListingDurationDays);

  /* Hero Omnibar Search states */
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedLandTypes, setSelectedLandTypes] = useState<string[]>(['FLAT']);
  const [selectedBhks, setSelectedBhks] = useState<string[]>([]);
  const [selectedBudgetIndex, setSelectedBudgetIndex] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  /* Popover states */
  const [landTypePopoverOpen, setLandTypePopoverOpen] = useState(false);
  const [budgetPopoverOpen, setBudgetPopoverOpen] = useState(false);

  /* Category accordion in Land Type Popover (Land & Plots + Residential expanded by default) */
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

  const toggleCategory = (
    cat: 'landPlots' | 'residential' | 'commercial' | 'hospitality' | 'rentals',
  ) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleToggleBhk = (bhk: string) => {
    setSelectedBhks((prev) =>
      prev.includes(bhk) ? prev.filter((b) => b !== bhk) : [...prev, bhk]
    );
  };

  const landTypeRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);

  /* User & Auth */
  const [user, setUser] = useState<Partial<IUser> | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  /* ================================================================
     LOAD REAL DATA & SESSION
  ================================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const needsProperties = !initialProperties || initialProperties.length === 0;
        const [propsRes, settingsRes] = await Promise.all([
          needsProperties ? fetch('/api/properties?limit=12&cardOnly=true') : Promise.resolve(null),
          fetch('/api/settings/public').catch(() => null),
        ]);

        if (settingsRes && 'ok' in settingsRes && settingsRes.ok) {
          const s = await settingsRes.json();
          if (!cancelled) {
            if (typeof s.listingFeeAmount === 'number') setPublicListingFee(s.listingFeeAmount);
            if (typeof s.listingFeeDurationDays === 'number') setListingDurationDays(s.listingFeeDurationDays);
          }
        }

        if (propsRes && 'ok' in propsRes && propsRes.ok) {
          const result = await propsRes.json();
          if (!cancelled && Array.isArray(result?.data)) {
            setProperties(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to load portal data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [initialProperties]);

  /* Close popovers on outside click */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        landTypeRef.current &&
        !landTypeRef.current.contains(e.target as Node)
      ) {
        setLandTypePopoverOpen(false);
      }
      if (budgetRef.current && !budgetRef.current.contains(e.target as Node)) {
        setBudgetPopoverOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleToggleLandType = (id: string) => {
    setSelectedLandTypes((prev) => {
      const next = prev.includes(id)
        ? prev.filter((t) => t !== id)
        : [...prev, id];
      // If no residential unit is selected anymore, clear BHKs
      if (!next.some((t) => residentialTypesSupportingBhk.includes(t))) {
        setSelectedBhks([]);
      }
      return next;
    });
  };

  /* ================================================================
     HANDLE SEARCH SUBMIT
  ================================================================ */

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();

    const params = new URLSearchParams();
    if (searchLocation.trim()) {
      params.set('query', searchLocation.trim());
    }

    if (selectedLandTypes.length > 0) {
      params.set('landType', selectedLandTypes.join(','));
    }

    if (selectedBhks.length > 0) {
      params.set('bhk', selectedBhks.join(','));
    }

    const budget = BUDGET_PRESETS[selectedBudgetIndex];
    if (budget.minPrice > 0) {
      params.set('minPrice', String(budget.minPrice));
    }
    if (budget.maxPrice > 0) {
      params.set('maxPrice', String(budget.maxPrice));
    }

    if (verifiedOnly) {
      params.set('verifiedOnly', 'true');
    }

    setLandTypePopoverOpen(false);
    setBudgetPopoverOpen(false);

    const q = params.toString();
    window.location.href = q ? `/buy?${q}` : '/buy';
  }

  /* Land Type & BHK Trigger Text (Matches Screenshot 1 & 2) */
  let landTypeTriggerText = 'Property Type';
  if (selectedLandTypes.length > 0) {
    const firstSelected = HERO_LAND_TYPES.find(
      (t) => t.id === selectedLandTypes[0]
    );
    if (firstSelected) {
      if (
        (firstSelected.id === 'FLAT' || firstSelected.id === 'HOUSE_VILLA') &&
        selectedBhks.length > 0
      ) {
        landTypeTriggerText = `${firstSelected.label} (${selectedBhks.join(', ')})`;
      } else if (selectedLandTypes.length > 1) {
        landTypeTriggerText = `${firstSelected.label} +${selectedLandTypes.length - 1}`;
      } else {
        landTypeTriggerText = firstSelected.label;
      }
    }
  }

  const selectedBudget = BUDGET_PRESETS[selectedBudgetIndex];



  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-[#FF9933] selection:text-white">
      <Navbar />

      <main className="flex-1 space-y-16 pb-20">
        {/* ═══════════════════════════════════════════════════════
            1. HERO PORTAL SEARCH SECTION (Ultra-Clean & Modern)
        ═══════════════════════════════════════════════════════ */}
        <section className="relative bg-gradient-to-b from-[#fff9f0] via-white to-white border-b border-slate-100 pt-10 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header copy */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#FF9933]/30 text-[#c75e0a] text-xs font-black shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#FF9933]" />
                <span>India&apos;s Direct Real Estate &amp; Property Portal • 0% Broker Commission</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
                Direct Properties, Homes &amp; Plots Across India
              </h1>

              <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
                India&apos;s direct peer-to-peer property marketplace. Buy, sell, or rent plots, apartments, villas, commercial spaces, and farmlands directly with genuine owners — 0% broker commissions and transparent document disclosure.
              </p>
            </div>

            {/* ── Main Unified Capsule Omnibar (Matching Magicbricks Screenshot) ── */}
            <div className="w-full max-w-4xl mx-auto space-y-4">
              <div className="relative bg-white rounded-3xl sm:rounded-full border border-slate-200/90 shadow-[0_12px_35px_rgba(0,0,0,0.08)] p-2 sm:p-2.5 transition-all focus-within:border-[#FF9933]/50 focus-within:shadow-[0_16px_40px_rgba(255,153,51,0.12)]">
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100 gap-2 sm:gap-0"
                >
                  {/* Segment 1: Location Input */}
                  <div className="flex-1 flex items-center px-4 py-2 sm:py-1">
                    <MapPin className="w-4 h-4 text-[#FF9933] shrink-0 mr-2.5" />
                    <input
                      type="text"
                      id="hero-search-location"
                      name="query"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      aria-label="Search by city, locality, or project name"
                      placeholder="Enter City, Locality, or Project e.g. Kokapet"
                      autoComplete="off"
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>

                  {/* Segment 2: Property / Land Type Dropdown with Popover */}
                  <div ref={landTypeRef} className="relative px-4 py-2 sm:py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLandTypePopoverOpen(!landTypePopoverOpen);
                        setBudgetPopoverOpen(false);
                      }}
                      aria-label="Select property or land type"
                      aria-expanded={landTypePopoverOpen}
                      className="w-full flex items-center justify-between sm:justify-start gap-2 text-left cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Home className="w-4 h-4 text-[#FF9933] shrink-0" />
                        <span className="text-xs sm:text-sm font-extrabold text-slate-800 truncate max-w-[150px]">
                          {landTypeTriggerText}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${landTypePopoverOpen ? 'rotate-180 text-[#FF9933]' : ''
                          }`}
                      />
                    </button>

                    {/* Land Type Popover (Directly matching Screenshot 2) */}
                    {landTypePopoverOpen && (
                      <div className="absolute left-0 sm:left-auto sm:right-0 top-[calc(100%+14px)] z-50 w-[320px] sm:w-[390px] p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                        {/* 1. Land & Plots */}
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => toggleCategory('landPlots')}
                            className="w-full flex items-center justify-between py-1 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span>Land &amp; Plots</span>
                              {HERO_LAND_TYPES.filter(
                                (t) => t.category === 'Land & Plots' && selectedLandTypes.includes(t.id)
                              ).length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#fff1dc] text-[#c75e0a] text-[10px] font-bold">
                                  {
                                    HERO_LAND_TYPES.filter(
                                      (t) => t.category === 'Land & Plots' && selectedLandTypes.includes(t.id)
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
                              {HERO_LAND_TYPES.filter((t) => t.category === 'Land & Plots').map((t) => {
                                const isSelected = selectedLandTypes.includes(t.id);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleToggleLandType(t.id)}
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
                              {HERO_LAND_TYPES.filter(
                                (t) => t.category === 'Residential Units' && selectedLandTypes.includes(t.id)
                              ).length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#fff1dc] text-[#c75e0a] text-[10px] font-bold">
                                  {
                                    HERO_LAND_TYPES.filter(
                                      (t) => t.category === 'Residential Units' && selectedLandTypes.includes(t.id)
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
                            <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
                              <div className="flex flex-wrap gap-1.5">
                                {HERO_LAND_TYPES.filter((t) => t.category === 'Residential Units').map((t) => {
                                  const isSelected = selectedLandTypes.includes(t.id);
                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => handleToggleLandType(t.id)}
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

                              {/* BHK Selection Row when any residential unit is selected */}
                              {selectedLandTypes.some((t) => residentialTypesSupportingBhk.includes(t)) && (
                                <div className="pt-2 border-t border-dashed border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                                  <div className="flex flex-wrap gap-1.5">
                                    {BHK_OPTIONS.map((bhk) => {
                                      const isBhkSelected = selectedBhks.includes(bhk);
                                      return (
                                        <button
                                          key={bhk}
                                          type="button"
                                          onClick={() => handleToggleBhk(bhk)}
                                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                                            isBhkSelected
                                              ? 'bg-[#FF9933] text-white border-[#FF9933] shadow-2xs'
                                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
                              {HERO_LAND_TYPES.filter(
                                (t) => t.category === 'Commercial & Retail' && selectedLandTypes.includes(t.id)
                              ).length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#fff1dc] text-[#c75e0a] text-[10px] font-bold">
                                  {
                                    HERO_LAND_TYPES.filter(
                                      (t) => t.category === 'Commercial & Retail' && selectedLandTypes.includes(t.id)
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
                              {HERO_LAND_TYPES.filter((t) => t.category === 'Commercial & Retail').map((t) => {
                                const isSelected = selectedLandTypes.includes(t.id);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleToggleLandType(t.id)}
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
                              {HERO_LAND_TYPES.filter(
                                (t) => t.category === 'Hospitality & Leisure' && selectedLandTypes.includes(t.id)
                              ).length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#fff1dc] text-[#c75e0a] text-[10px] font-bold">
                                  {
                                    HERO_LAND_TYPES.filter(
                                      (t) => t.category === 'Hospitality & Leisure' && selectedLandTypes.includes(t.id)
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
                              {HERO_LAND_TYPES.filter((t) => t.category === 'Hospitality & Leisure').map((t) => {
                                const isSelected = selectedLandTypes.includes(t.id);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleToggleLandType(t.id)}
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
                              {HERO_LAND_TYPES.filter(
                                (t) => t.category === 'Income-Generating & Rentals' && selectedLandTypes.includes(t.id)
                              ).length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#fff1dc] text-[#c75e0a] text-[10px] font-bold">
                                  {
                                    HERO_LAND_TYPES.filter(
                                      (t) => t.category === 'Income-Generating & Rentals' && selectedLandTypes.includes(t.id)
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
                              {HERO_LAND_TYPES.filter((t) => t.category === 'Income-Generating & Rentals').map((t) => {
                                const isSelected = selectedLandTypes.includes(t.id);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleToggleLandType(t.id)}
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

                  {/* Segment 3: Budget Dropdown with Popover */}
                  <div ref={budgetRef} className="relative px-4 py-2 sm:py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setBudgetPopoverOpen(!budgetPopoverOpen);
                        setLandTypePopoverOpen(false);
                      }}
                      aria-label="Select budget range"
                      aria-expanded={budgetPopoverOpen}
                      className="w-full flex items-center justify-between sm:justify-start gap-2 text-left cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center text-xs font-black shrink-0">
                          ₹
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-800 truncate max-w-[130px]">
                          {selectedBudget.label}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${budgetPopoverOpen ? 'rotate-180 text-[#FF9933]' : ''
                          }`}
                      />
                    </button>

                    {/* Budget Popover */}
                    {budgetPopoverOpen && (
                      <div className="absolute left-0 sm:left-auto sm:right-0 top-[calc(100%+14px)] z-50 w-[280px] sm:w-[320px] p-4 rounded-3xl bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                        <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                          Select Budget Range
                        </div>

                        <div className="space-y-1.5">
                          {BUDGET_PRESETS.map((preset, idx) => {
                            const isSelected = selectedBudgetIndex === idx;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                  setSelectedBudgetIndex(idx);
                                  setBudgetPopoverOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${isSelected
                                    ? 'bg-[#fff1dc] text-[#c75e0a] border border-[#FF9933]/40'
                                    : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                              >
                                <span>{preset.label}</span>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Segment 4: Search Button */}
                  <div className="px-2 py-1">
                    <button
                      type="submit"
                      aria-label="Search verified properties"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl sm:rounded-full bg-[#FF9933] hover:bg-[#f07d12] text-white text-sm font-black shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
                    >
                      <Search className="w-4 h-4" />
                      <span>Search</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* ── Popular Search Chips & Verified Toggle Beneath ── */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
                <label htmlFor="hero-verified-only" className="inline-flex items-center gap-2 text-slate-700 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="hero-verified-only"
                    name="verifiedOnly"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#FF9933] border-slate-300"
                  />
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#FF9933]" />
                    <span className="text-xs font-bold text-slate-700">
                      Direct Owner Listings Only (0% Brokerage)
                    </span>
                  </span>
                </label>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 font-bold text-xs">Popular:</span>
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <Link
                      key={tag.label}
                      href={`/buy?query=${encodeURIComponent(tag.query)}`}
                      className="px-3 py-1 rounded-full bg-white hover:bg-[#fff1dc] hover:text-[#c75e0a] text-slate-600 text-xs font-bold border border-slate-200/80 shadow-2xs transition-colors"
                    >
                      {tag.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            2. FOUR VALUE PILLARS (Clean Minimalist White Cards)
        ═══════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-labelledby="platform-highlights-heading">
          <h2 id="platform-highlights-heading" className="sr-only">
            Why Choose BhoomiMitra Platform Highlights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center font-bold">
                <HeartHandshake className="w-5 h-5 text-[#FF9933]" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-950">0% Broker Commission</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Deal directly with genuine property owners. No middleman cuts, broker markups, or success commissions.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center font-bold">
                <Scale className="w-5 h-5 text-[#FF9933]" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-950">Buyer Due Diligence Guide</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Inspect 30-year sale deed chains, EC Form 15, Pahani/7-12 extracts, and FMB sketches before finalizing deals.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center font-bold">
                <Phone className="w-5 h-5 text-[#FF9933]" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-950">Direct &quot;Call Owner&quot;</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Call verified property owners directly. Inquiries are safely logged in your dashboard for total transparency.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center font-bold">
                <Tag className="w-5 h-5 text-[#FF9933]" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-950">Flat ₹{publicListingFee} for {listingDurationDays} Days</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Transparent and affordable classifieds publishing fee for sellers with zero commission upon sale.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            3. REAL FEATURED PROPERTIES SECTION (Direct Classifieds)
        ═══════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  Featured Property Classifieds
                </h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#fff1dc] text-[#c75e0a] text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
                  <span>Direct Classifieds • 0% Brokerage</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real published properties from direct owners with verified phone contact
              </p>
            </div>

            <Link
              href="/buy"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#c75e0a] hover:text-[#FF9933] hover:underline"
            >
              <span>View All Properties</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="rounded-3xl border border-slate-200 bg-white p-4 space-y-3 animate-pulse"
                >
                  <div className="h-44 bg-slate-100 rounded-2xl" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-9 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            /* Clean, elegant real empty state without any fake/demo cards */
            <div className="p-10 sm:p-14 text-center bg-gradient-to-b from-[#fffbf5] to-white rounded-3xl border border-dashed border-[#FF9933]/40 space-y-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-white text-[#FF9933] border border-[#FF9933]/30 shadow-xs flex items-center justify-center mx-auto">
                <LandPlot className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">
                  No Active Property Listings Published Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Be the first owner to list your plot, home, or commercial space. Reach thousands of serious buyers and tenants across India with zero brokerage.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/sell"
                  prefetch={false}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF9933] text-white text-xs font-extrabold shadow-md hover:bg-[#f07d12] transition-colors"
                >
                  <span>Post Your Property Listing — Flat ₹{publicListingFee} for {listingDurationDays} Days</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5 sm:gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property._id}
                  property={property}
                  priority={false}
                  onRequireLogin={() => setAuthModalOpen(true)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════
            4. LAND BUYER'S DUE DILIGENCE CHECKLIST
        ═══════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DueDiligenceChecklist />
        </section>

        {/* ═══════════════════════════════════════════════════════
            5. INTERACTIVE INDIAN LAND AREA CONVERTER
        ═══════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandAreaConverter />
        </section>

        {/* ═══════════════════════════════════════════════════════
            5. "SELL YOUR LAND" HIGH-CONVERSION BANNER
        ═══════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-950 via-[#7f3e10] to-[#c75e0a] text-white p-8 sm:p-12 shadow-xl border border-[#FF9933]/30">
            <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[#ffe1b8] text-[11px] font-bold border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
                <span>For Direct Property Owners</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Are You a Property Owner? Sell or Rent in 3 Simple Steps
              </h2>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Publish your plot, flat, villa, or commercial property for a flat advertisement fee of just{' '}
                <strong className="text-[#FF9933] font-extrabold">
                  ₹{publicListingFee} for {listingDurationDays} Days
                </strong>
                . Zero broker commission upon sale or lease. Reach thousands of serious buyers &amp; tenants across India.
              </p>

              {/* 3 Step indicators */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/10 border border-white/15">
                  <div className="w-6 h-6 rounded-full bg-[#FF9933] text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <span className="font-semibold text-white">Enter Property Details &amp; Price</span>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/10 border border-white/15">
                  <div className="w-6 h-6 rounded-full bg-[#FF9933] text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <span className="font-semibold text-white">Upload Photos &amp; Proofs</span>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/10 border border-white/15">
                  <div className="w-6 h-6 rounded-full bg-[#FF9933] text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <span className="font-semibold text-white">Pay ₹{publicListingFee} &amp; Go Live</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/sell"
                  prefetch={false}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#FF9933] hover:bg-[#f07d12] text-white text-xs font-black shadow-lg transition-all hover:shadow-[#FF9933]/30 cursor-pointer"
                >
                  <span>Post Your Property Listing Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/listing-rules"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-[#ffe1b8] hover:underline"
                >
                  <span>Read Listing Guidelines</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            6. MULTI-COLUMN SEO DIRECTORY (Clean Real Routes)
        ═══════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="border-t border-slate-200 pt-8">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-6">
              Explore Properties &amp; Plots by State, Category &amp; Legal Guides
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-5 text-xs">
              <div className="space-y-2">
                <div className="font-bold text-slate-900">Properties by State</div>
                <ul className="space-y-1.5 text-slate-500">
                  <li>
                    <Link href="/buy?state=Telangana" className="hover:text-[#FF9933]">
                      Properties in Telangana
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?state=Andhra+Pradesh" className="hover:text-[#FF9933]">
                      Properties in Andhra Pradesh
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?state=Karnataka" className="hover:text-[#FF9933]">
                      Properties in Karnataka
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?state=Maharashtra" className="hover:text-[#FF9933]">
                      Properties in Maharashtra
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?state=Tamil+Nadu" className="hover:text-[#FF9933]">
                      Properties in Tamil Nadu
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900">Properties by Category</div>
                <ul className="space-y-1.5 text-slate-500">
                  <li>
                    <Link href="/buy?landType=FLAT,DUPLEX,PENTHOUSE" className="hover:text-[#FF9933]">
                      Flats &amp; Apartments
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?landType=VILLA,HOUSE_VILLA,INDEPENDENT_HOUSE" className="hover:text-[#FF9933]">
                      Houses &amp; Luxury Villas
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?landType=OPEN_PLOT,FARMLAND_PLOT,GATED_COMMUNITY_PLOT,RESIDENTIAL_PLOT" className="hover:text-[#FF9933]">
                      Open &amp; Gated Layout Plots
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?landType=COMMERCIAL_LAND,OFFICE_SPACE,RETAIL_SHOP,SHOWROOM" className="hover:text-[#FF9933]">
                      Commercial &amp; Retail Spaces
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?landType=AGRICULTURAL_LAND,FARM_HOUSE_LAND" className="hover:text-[#FF9933]">
                      Farmlands &amp; Farmhouses
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900">Popular Corridors</div>
                <ul className="space-y-1.5 text-slate-500">
                  <li>
                    <Link href="/buy?query=Kokapet" className="hover:text-[#FF9933]">
                      Kokapet &amp; Neopolis Plots
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?query=Shamshabad" className="hover:text-[#FF9933]">
                      Shamshabad Airport Zone
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?query=Moinabad" className="hover:text-[#FF9933]">
                      Moinabad Farmlands
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?query=Shankarpally" className="hover:text-[#FF9933]">
                      Shankarpally Residential Plots
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?query=Devanahalli" className="hover:text-[#FF9933]">
                      Devanahalli Bengaluru Rural
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900">Help &amp; Legal Guides</div>
                <ul className="space-y-1.5 text-slate-500">
                  <li>
                    <Link href="/pricing" className="hover:text-[#FF9933]">
                      Listing Pricing &amp; Plans
                    </Link>
                  </li>
                  <li>
                    <Link href="/listing-rules" className="hover:text-[#FF9933]">
                      Classifieds Publishing Rules
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-[#FF9933]">
                      Grievance &amp; Customer Support
                    </Link>
                  </li>
                  <li>
                    <Link href="/refund-policy" className="hover:text-[#FF9933]">
                      Refund Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-[#FF9933]">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {footer}



      {/* Authentication Modal */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      )}
    </div>
  );
}

export default HomePageClient;