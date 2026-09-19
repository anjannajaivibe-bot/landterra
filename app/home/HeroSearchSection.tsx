"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  Building2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Check,
  Search,
  Sparkles,
  Home,
} from "lucide-react";
import { CANONICAL_PROPERTY_TYPES as HERO_LAND_TYPES } from "@/config/constants";
import {
  BHK_OPTIONS,
  BUDGET_PRESETS,
  POPULAR_SEARCH_TAGS,
  residentialTypesSupportingBhk,
} from "./HomeSearchConstants";

export function HeroSearchSection() {
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedLandTypes, setSelectedLandTypes] = useState<string[]>([]);
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
  }>({
    landPlots: true,
    residential: true,
    commercial: false,
    hospitality: false,
  });

  const toggleCategory = (
    cat: 'landPlots' | 'residential' | 'commercial' | 'hospitality',
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


  useEffect(() => {
    try {
      const savedCity = localStorage.getItem('bhoomimitra_selected_city');
      if (savedCity && savedCity !== 'All India' && !savedCity.startsWith('NRI: ')) {
        setSearchLocation(savedCity);
      }
    } catch {
      // ignore
    }

    const handleCityChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ city?: string }>;
      const city = customEvent.detail?.city;
      if (city) {
        setSearchLocation(city === 'All India' || city.startsWith('NRI: ') ? '' : city);
      }
    };

    window.addEventListener('bhoomimitra_city_changed', handleCityChanged);
    return () => {
      window.removeEventListener('bhoomimitra_city_changed', handleCityChanged);
    };
  }, []);

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
  let landTypeTriggerText = 'All Property Types';
  if (selectedLandTypes.length > 0) {
    const firstSelected = HERO_LAND_TYPES.find(
      (t) => t.id === selectedLandTypes[0]
    );
    if (firstSelected) {
      if (
        residentialTypesSupportingBhk.includes(firstSelected.id) &&
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
        <section className="relative bg-gradient-to-b from-[#fff9f0] via-white to-white border-b border-slate-100 pt-10 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header copy */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#FF9933]/30 text-[#c75e0a] text-xs font-black shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#FF9933]" />
                <span>Property marketplace • 0% platform brokerage</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
                Properties for Sale, Rent &amp; Lease Across India
              </h1>

              <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
                Explore plots, homes, commercial spaces and hospitality properties across India. Contact the listed seller directly while BhoomiMitra charges no platform brokerage.
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
                    <label htmlFor="hero-search-location" className="sr-only">
                      Search by city, locality, or project name
                    </label>
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
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                            Property Types
                          </span>
                          {selectedLandTypes.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLandTypes([]);
                                setSelectedBhks([]);
                              }}
                              className="text-[11px] font-bold text-[#c75e0a] hover:underline cursor-pointer"
                            >
                              Reset to All
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

                        {/* 2. Residential */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleCategory('residential')}
                            className="w-full flex items-center justify-between py-1 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span>Residential</span>
                              {HERO_LAND_TYPES.filter(
                                (t) => t.category === 'Residential' && selectedLandTypes.includes(t.id)
                              ).length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#fff1dc] text-[#c75e0a] text-[10px] font-bold">
                                  {
                                    HERO_LAND_TYPES.filter(
                                      (t) => t.category === 'Residential' && selectedLandTypes.includes(t.id)
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
                                {HERO_LAND_TYPES.filter((t) => t.category === 'Residential').map((t) => {
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

                        {/* 3. Commercial */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleCategory('commercial')}
                            className="w-full flex items-center justify-between py-1 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span>Commercial &amp; Retail</span>
                              {HERO_LAND_TYPES.filter(
                                (t) => t.category === 'Commercial' && selectedLandTypes.includes(t.id)
                              ).length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#fff1dc] text-[#c75e0a] text-[10px] font-bold">
                                  {
                                    HERO_LAND_TYPES.filter(
                                      (t) => t.category === 'Commercial' && selectedLandTypes.includes(t.id)
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
                              {HERO_LAND_TYPES.filter((t) => t.category === 'Commercial').map((t) => {
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

                        {/* 4. Hospitality */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleCategory('hospitality')}
                            className="w-full flex items-center justify-between py-1 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span>Hospitality &amp; Leisure</span>
                              {HERO_LAND_TYPES.filter(
                                (t) => t.category === 'Hospitality' && selectedLandTypes.includes(t.id)
                              ).length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#fff1dc] text-[#c75e0a] text-[10px] font-bold">
                                  {
                                    HERO_LAND_TYPES.filter(
                                      (t) => t.category === 'Hospitality' && selectedLandTypes.includes(t.id)
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
                              {HERO_LAND_TYPES.filter((t) => t.category === 'Hospitality').map((t) => {
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
                      aria-label="Search properties"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl sm:rounded-full bg-[#FF9933] hover:bg-[#f07d12] text-white text-sm font-black shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
                    >
                      <Search className="w-4 h-4" />
                      <span>Search</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Popular search chips and individual-seller filter */}
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
                      Individual Seller listings
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
  );
}
