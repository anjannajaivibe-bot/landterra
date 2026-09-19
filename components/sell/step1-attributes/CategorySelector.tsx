'use client';

import React from 'react';
import { LAND_TYPES, normalizePropertyTypeId } from '@/config/constants';
import { LandType } from '@/types/property';
import { SellFormState, SellFormActions } from '@/types/sell-form';

interface CategorySelectorProps {
  state: SellFormState;
  actions: SellFormActions;
}

const CATEGORY_TABS = [
  { id: 'Land & Plots', label: 'Land & Plots' },
  { id: 'Residential', label: 'Residential' },
  { id: 'Commercial', label: 'Commercial' },
  { id: 'Hospitality', label: 'Hospitality' },
] as const;

function normalizeCategory(value: string) {
  if (value === 'Residential Units') return 'Residential';
  if (value === 'Commercial & Retail') return 'Commercial';
  if (value === 'Hospitality & Leisure') return 'Hospitality';
  if (value === 'Income-Generating & Rentals') return 'Residential';
  return value;
}

export function CategorySelector({ state, actions }: CategorySelectorProps) {
  const { landType, sellerCategoryTab } = state;
  const { setLandType, setSellerCategoryTab } = actions;

  const activeCategory = normalizeCategory(sellerCategoryTab);
  const normalizedLandType = normalizePropertyTypeId(landType);

  const visibleTypes = LAND_TYPES.filter(
    (type) => type.category === activeCategory,
  );

  return (
    <section className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-800">
          Property type *
        </label>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Choose the closest match. We will show only the fields relevant to that property.
        </p>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const active = activeCategory === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSellerCategoryTab(tab.id)}
              className={`px-3 py-2 rounded-lg border text-xs font-bold whitespace-nowrap transition-colors ${
                active
                  ? 'border-[#FF9933] bg-[#fff8ef] text-[#a84f08]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {visibleTypes.map((type: any) => {
          const value = type.value || type.id || type;
          const label = type.label || type.name || value;
          const isSelected = normalizedLandType === value;

          return (
            <button
              key={value}
              type="button"
              onClick={() => setLandType(value as LandType)}
              className={`min-h-14 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                isSelected
                  ? 'border-[#FF9933] bg-[#fff8ef] text-[#7a3705]'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold leading-tight">
                  {label}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[#FF9933] shrink-0" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
