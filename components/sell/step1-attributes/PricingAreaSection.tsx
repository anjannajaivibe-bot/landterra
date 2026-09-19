'use client';

import React from 'react';
import { Ruler, IndianRupee } from 'lucide-react';
import { LandAreaUnit, SellFormState, SellFormActions } from '@/types/sell-form';

const LAND_AREA_UNIT_LABELS: Record<LandAreaUnit, string> = {
  SQUARE_YARDS: 'Square Yards',
  SQUARE_FEET: 'Square Feet',
  GUNTAS: 'Guntas',
  CENTS: 'Cents',
  ACRES: 'Acres',
  HECTARES: 'Hectares',
};

const LAND_AREA_UNIT_SHORT_LABELS: Record<LandAreaUnit, string> = {
  SQUARE_YARDS: 'sq. yd',
  SQUARE_FEET: 'sq. ft',
  GUNTAS: 'guntas',
  CENTS: 'cents',
  ACRES: 'acres',
  HECTARES: 'hectares',
};

function formatArea(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '0';

  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface PricingAreaSectionProps {
  state: SellFormState;
  actions: SellFormActions;
}

export function PricingAreaSection({ state, actions }: PricingAreaSectionProps) {
  const {
    transactionType,
    landType,
    areaInput,
    selectedAreaUnit,
    areaConversions,
    pricePerYard,
    priceNegotiable,
    authoritativeFees,
    monthlyRent,
  } = state;

  const {
    setAreaInput,
    setSelectedAreaUnit,
    setPricePerYard,
    setPriceNegotiable,
    setMonthlyRent,
  } = actions;

  const landAreaYards = authoritativeFees.landAreaYards;
  const monthlyAmount = Number(String(monthlyRent).replace(/,/g, '')) || 0;
  const isSale = transactionType === 'SALE';

  const landRateTypes = [
    'RESIDENTIAL_PLOT',
    'FARMLAND_PLOT',
    'AGRICULTURAL_LAND',
    'COMMERCIAL_LAND',
    'INDUSTRIAL_PLOT',
    'INSTITUTIONAL',
    // Legacy compatibility
    'OPEN_PLOT',
    'GATED_COMMUNITY_PLOT',
  ];

  const apartmentAreaTypes = [
    'FLAT',
    'PENTHOUSE',
    'SERVICE_APARTMENT',
  ];

  const landedResidentialTypes = [
    'INDEPENDENT_HOUSE',
    'VILLA',
    'TOWNHOUSE',
    'DUPLEX',
    'FARMHOUSE',
    // Legacy compatibility
    'HOUSE_VILLA',
    'FARM_HOUSE_LAND',
  ];

  const usesPerYardPricing = landRateTypes.includes(landType);

  const areaLabel = apartmentAreaTypes.includes(landType)
    ? 'Super built-up area'
    : landedResidentialTypes.includes(landType)
      ? 'Plot / land area'
      : landRateTypes.includes(landType)
        ? 'Land / plot area'
        : ['HOTEL', 'RESORT', 'GUEST_HOUSE'].includes(landType)
          ? 'Property / site area'
          : 'Built-up / usable area';

  const totalAskingPrice = Number(authoritativeFees.totalPrice || 0);
  const approxRatePerSqFt =
    Number(pricePerYard) > 0 ? Number(pricePerYard) / 9 : 0;

  return (
    <section className="space-y-5">
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Area and asking {isSale ? 'price' : transactionType === 'RENT' ? 'rent' : 'lease amount'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enter the area in the unit you normally use. BhoomiMitra normalizes it automatically.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_190px] gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              {areaLabel} *
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={areaInput}
                onChange={(event) => setAreaInput(event.target.value)}
                placeholder="Enter area"
                className="w-full px-4 py-3 pr-20 rounded-lg border border-slate-300 bg-white text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                {LAND_AREA_UNIT_SHORT_LABELS[selectedAreaUnit]}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Area unit
            </label>
            <select
              value={selectedAreaUnit}
              onChange={(event) =>
                setSelectedAreaUnit(event.target.value as LandAreaUnit)
              }
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
            >
              {(Object.keys(LAND_AREA_UNIT_LABELS) as LandAreaUnit[]).map(
                (unit) => (
                  <option key={unit} value={unit}>
                    {LAND_AREA_UNIT_LABELS[unit]}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {landAreaYards > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
            <span>
              {formatArea(areaConversions.sqYards, 2)} sq. yd
            </span>
            <span>
              {formatArea(areaConversions.sqFeet, 0)} sq. ft
            </span>
            <span>
              {formatArea(areaConversions.guntas, 2)} guntas
            </span>
            <span>
              {formatArea(areaConversions.acres, 4)} acres
            </span>
          </div>
        )}

        {landAreaYards > 100000000 && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            Entered area exceeds the supported maximum. Please check the value and unit.
          </div>
        )}
      </div>

      {isSale ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {usesPerYardPricing ? 'Asking price per sq. yd' : 'Total asking price'} *
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {usesPerYardPricing ? (
                <input
                  type="number"
                  min={1}
                  value={pricePerYard}
                  onChange={(event) => setPricePerYard(event.target.value)}
                  placeholder="Price per sq. yd"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                />
              ) : (
                <input
                  type="text"
                  inputMode="numeric"
                  value={totalAskingPrice > 0 ? String(Math.round(totalAskingPrice)) : ''}
                  onChange={(event) => {
                    const total = Number(event.target.value.replace(/[^0-9]/g, '')) || 0;
                    setPricePerYard(
                      total > 0 && landAreaYards > 0
                        ? String(total / landAreaYards)
                        : '',
                    );
                  }}
                  placeholder="Example: 12500000"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                />
              )}
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {usesPerYardPricing ? 'Estimated total asking price' : 'Approximate area rate'}
            </p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">
              {usesPerYardPricing
                ? `₹${totalAskingPrice.toLocaleString('en-IN')}`
                : approxRatePerSqFt > 0
                  ? `₹${Math.round(approxRatePerSqFt).toLocaleString('en-IN')} / sq. ft`
                  : 'Add area and asking price'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              {usesPerYardPricing
                ? 'Based on your area and price per sq. yd.'
                : 'Calculated from the total asking price and entered area.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {transactionType === 'RENT' ? 'Expected monthly rent' : 'Expected monthly lease amount'} *
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                inputMode="numeric"
                value={monthlyRent}
                onChange={(event) =>
                  setMonthlyRent(event.target.value.replace(/[^0-9]/g, ''))
                }
                placeholder="Example: 45000"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
              />
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Asking amount
            </p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">
              ₹{monthlyAmount.toLocaleString('en-IN')}
              <span className="text-xs font-semibold text-slate-500"> / month</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              You can add deposit, lock-in and maintenance details below.
            </p>
          </div>
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={priceNegotiable}
          onChange={(event) => setPriceNegotiable(event.target.checked)}
          className="w-4 h-4 accent-[#FF9933]"
        />
        <span className="text-xs font-semibold text-slate-700">
          Asking amount is negotiable
        </span>
      </label>
    </section>
  );
}
