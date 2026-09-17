'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  MapPin,
  X,
  ChevronDown,
  Building2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { INDIAN_STATES } from '@/config/constants';
import {
  ALL_PROPERTY_TYPES,
  BHK_OPTIONS,
  RESIDENTIAL_TYPES_SUPPORTING_BHK,
  BUDGET_PRESETS,
  AREA_PRESETS,
} from './types';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onSearchSubmit: (event?: React.FormEvent<HTMLFormElement>) => void;
  selectedPropertyTypes: string[];
  selectedBhks: string[];
  onTogglePropertyType: (id: string) => void;
  onToggleBhk: (bhk: string) => void;
  onClearPropertyTypes: () => void;
  selectedState: string;
  onStateChange: (state: string) => void;
  selectedBudgetIndex: number;
  onBudgetPresetChange: (idx: number) => void;
  selectedAreaIndex: number;
  onAreaPresetChange: (idx: number) => void;
  verifiedOnly: boolean;
  onToggleVerified: (verified: boolean) => void;
}

export function FilterBar({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  selectedPropertyTypes,
  selectedBhks,
  onTogglePropertyType,
  onToggleBhk,
  onClearPropertyTypes,
  selectedState,
  onStateChange,
  selectedBudgetIndex,
  onBudgetPresetChange,
  selectedAreaIndex,
  onAreaPresetChange,
  verifiedOnly,
  onToggleVerified,
}: FilterBarProps) {
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

  return (
    <form onSubmit={onSearchSubmit} className="relative z-30 mt-6 w-full">
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-3.5 sm:p-5 transition-all focus-within:border-[#FF9933]/40">
        {/* Row 1: Search Omnibar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1 flex items-center px-4 py-3 rounded-2xl bg-[#f8fafc] border border-slate-200/80 focus-within:bg-white focus-within:border-[#FF9933]/60 focus-within:ring-2 focus-within:ring-[#FF9933]/15 transition-all">
            <label htmlFor="buy-search-location" className="sr-only">
              Search Location, City, Locality, or Project
            </label>
            <MapPin className="h-4 w-4 text-[#FF9933] shrink-0 mr-2.5" />
            <input
              type="text"
              id="buy-search-location"
              name="query"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Enter city, locality, district, or project e.g. Kokapet, Visakhapatnam, Hyderabad, Bengaluru..."
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
              <span className="shrink-0 mr-1.5 px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 rounded-full select-none">
                Min 3 chars
              </span>
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
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
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Property Type
              </span>
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
                        onClick={onClearPropertyTypes}
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
                              onClick={() => onTogglePropertyType(t.id)}
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
                                onClick={() => onTogglePropertyType(t.id)}
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
                        {selectedPropertyTypes.some((t) => RESIDENTIAL_TYPES_SUPPORTING_BHK.includes(t)) && (
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
                                    onClick={() => onToggleBhk(bhk)}
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
                              onClick={() => onTogglePropertyType(t.id)}
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
                              onClick={() => onTogglePropertyType(t.id)}
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
                              onClick={() => onTogglePropertyType(t.id)}
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
              <label htmlFor="filter-region-state" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Region / State
              </label>
              <select
                id="filter-region-state"
                name="regionState"
                aria-label="Filter properties by Indian Region or State"
                value={selectedState}
                onChange={(e) => onStateChange(e.target.value)}
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
              <label htmlFor="filter-budget-range" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Budget Range
              </label>
              <select
                id="filter-budget-range"
                name="budgetRange"
                aria-label="Filter properties by Budget Range"
                value={selectedBudgetIndex}
                onChange={(e) => onBudgetPresetChange(Number(e.target.value))}
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
              <label htmlFor="filter-land-area" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Land Area
              </label>
              <select
                id="filter-land-area"
                name="landArea"
                aria-label="Filter properties by Land Area Extent"
                value={selectedAreaIndex}
                onChange={(e) => onAreaPresetChange(Number(e.target.value))}
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
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Ownership
              </span>
              <button
                type="button"
                onClick={() => onToggleVerified(!verifiedOnly)}
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
  );
}
