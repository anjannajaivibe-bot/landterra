'use client';

import React from 'react';
import { X } from 'lucide-react';
import {
  ALL_PROPERTY_TYPES,
  DEFAULT_MAX_PRICE,
  DEFAULT_MAX_AREA,
  formatIndianCurrency,
  formatArea,
} from './types';

interface ActiveFilterBadgesProps {
  searchQuery: string;
  selectedPropertyTypes: string[];
  selectedBhks: string[];
  selectedState: string;
  verifiedOnly: boolean;
  transactionType?: string;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  onClearQuery: () => void;
  onTogglePropertyType: (id: string) => void;
  onToggleBhk: (bhk: string) => void;
  onClearState: () => void;
  onToggleVerified: (val: boolean) => void;
  onResetTransactionType?: () => void;
  onResetPrice: () => void;
  onResetArea: () => void;
  onResetAll: () => void;
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

export function ActiveFilterBadges({
  searchQuery,
  selectedPropertyTypes,
  selectedBhks,
  selectedState,
  verifiedOnly,
  transactionType,
  minPrice,
  maxPrice,
  minArea,
  maxArea,
  onClearQuery,
  onTogglePropertyType,
  onToggleBhk,
  onClearState,
  onToggleVerified,
  onResetTransactionType,
  onResetPrice,
  onResetArea,
  onResetAll,
}: ActiveFilterBadgesProps) {
  const hasActiveFilters =
    searchQuery.trim() ||
    (transactionType && transactionType !== 'ALL') ||
    selectedPropertyTypes.length > 0 ||
    selectedBhks.length > 0 ||
    selectedState !== 'ALL' ||
    verifiedOnly ||
    minPrice > 0 ||
    maxPrice < DEFAULT_MAX_PRICE ||
    minArea > 0 ||
    maxArea < DEFAULT_MAX_AREA;

  if (!hasActiveFilters) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Active Filters:
      </span>

      {searchQuery.trim() && (
        <FilterChip
          label={`Location: ${searchQuery}`}
          onRemove={onClearQuery}
        />
      )}

      {transactionType && transactionType !== 'ALL' && (
        <FilterChip
          label={`For: ${transactionType === 'SALE' ? 'Buy' : transactionType === 'RENT' ? 'Rent' : 'Lease'}`}
          onRemove={onResetTransactionType || (() => {})}
        />
      )}

      {selectedPropertyTypes.map((typeId) => {
        const found = ALL_PROPERTY_TYPES.find((t) => t.id === typeId);
        return (
          <FilterChip
            key={typeId}
            label={`Type: ${found ? found.label : typeId}`}
            onRemove={() => onTogglePropertyType(typeId)}
          />
        );
      })}

      {selectedBhks.map((bhk) => (
        <FilterChip
          key={bhk}
          label={bhk}
          onRemove={() => onToggleBhk(bhk)}
        />
      ))}

      {selectedState !== 'ALL' && (
        <FilterChip
          label={`State: ${selectedState}`}
          onRemove={onClearState}
        />
      )}

      {verifiedOnly && (
        <FilterChip
          label="Direct Landowner Only"
          onRemove={() => onToggleVerified(false)}
        />
      )}

      {maxPrice < DEFAULT_MAX_PRICE && (
        <FilterChip
          label={`Max Budget: ${formatIndianCurrency(maxPrice)}`}
          onRemove={onResetPrice}
        />
      )}

      {maxArea < DEFAULT_MAX_AREA && (
        <FilterChip
          label={`Max Area: ${formatArea(maxArea)}`}
          onRemove={onResetArea}
        />
      )}

      <button
        type="button"
        onClick={onResetAll}
        className="ml-1 text-xs font-black text-[#c75e0a] hover:underline cursor-pointer"
      >
        Clear All
      </button>
    </div>
  );
}
