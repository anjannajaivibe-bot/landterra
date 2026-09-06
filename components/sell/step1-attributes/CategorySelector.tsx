'use client';

import React from 'react';
import { LAND_TYPES } from '@/config/constants';
import { LandType } from '@/types/property';
import { SellFormState, SellFormActions } from '@/types/sell-form';
import { Sparkles } from 'lucide-react';

interface CategorySelectorProps {
  state: SellFormState;
  actions: SellFormActions;
}

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'Land & Plots', label: 'Land & Plots' },
  { id: 'Residential Units', label: 'Residential Units' },
  { id: 'Commercial & Retail', label: 'Commercial & Retail' },
  { id: 'Hospitality & Leisure', label: 'Hospitality & Leisure' },
  { id: 'Income-Generating & Rentals', label: 'Income & Rentals' },
];

export function CategorySelector({ state, actions }: CategorySelectorProps) {
  const { landType, sellerCategoryTab } = state;
  const { setLandType, setSellerCategoryTab } = actions;
  const currentTypeConfig = LAND_TYPES.find(
    (t: any) => (t.value || t.id || t) === landType
  );
  const currentLabel =
    currentTypeConfig?.shortLabel || landType.replace(/_/g, ' ');

  return (
    <div className="space-y-4">
      {/* Property Type Selection Header */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="block text-xs font-bold text-slate-800">
            Property Type *
          </label>
          <span className="text-[11px] font-semibold text-[#c75e0a]">
            Select category &amp; subtype to customize specifications
          </span>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 overflow-x-auto scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSellerCategoryTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                sellerCategoryTab === tab.id
                  ? 'bg-white text-[#c75e0a] shadow-xs border border-amber-200 ring-1 ring-[#FF9933]/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Property Type Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LAND_TYPES.filter(
            (t: any) =>
              sellerCategoryTab === 'ALL' || t.category === sellerCategoryTab
          ).map((type: any) => {
            const value = type.value || type.id || type;
            const label = type.label || type.name || value;
            const isSelected = landType === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setLandType(value as LandType);
                  if (type.category) setSellerCategoryTab(type.category);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#FF9933] bg-[#fff9f0] text-[#7a3705] font-bold ring-2 ring-[#FF9933]/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] block leading-tight">
                    {label}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#FF9933] shrink-0 ml-1.5" />
                  )}
                </div>
                {type.category && (
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-medium truncate">
                    {type.category}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Real Estate Specifications Indicator Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#fff9f0] via-[#fff1dc]/40 to-amber-50/50 border border-amber-200/90 shadow-xs animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FF9933] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-900 tracking-tight">
                Dynamic Specifications Activated
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF9933] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                {currentLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Features below automatically adapt to real estate market standards
              for this property type. You can customize any item.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-200/80 text-[10px] font-bold text-[#c75e0a]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Dynamic Portal Sync
          </span>
        </div>
      </div>
    </div>
  );
}
