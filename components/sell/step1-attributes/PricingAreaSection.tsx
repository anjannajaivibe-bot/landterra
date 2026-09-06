'use client';

import React from 'react';
import { Ruler, IndianRupee, CheckCircle2 } from 'lucide-react';
import { LandAreaUnit, SellFormState, SellFormActions } from '@/types/sell-form';

const LAND_AREA_UNIT_LABELS: Record<LandAreaUnit, string> = {
  SQUARE_YARDS: 'Square Yards',
  SQUARE_FEET: 'Square Feet (sq. ft)',
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
    areaInput,
    selectedAreaUnit,
    areaConversions,
    pricePerYard,
    priceNegotiable,
    authoritativeFees,
  } = state;

  const {
    setAreaInput,
    setSelectedAreaUnit,
    setPricePerYard,
    setPriceNegotiable,
  } = actions;

  const landAreaYards = authoritativeFees.landAreaYards;

  return (
    <div className="space-y-5">
      {/* Multi-Unit Land Area Section */}
      <div className="rounded-2xl border border-[#FF9933]/30 bg-[#fff9f0] p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Land Area</h3>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Enter the measurement in the unit you normally use. BhoomiMitra
              automatically converts it into square yards.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_190px] gap-3">
          {/* Area Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Land Area Value *
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                placeholder="Enter land area"
                className="w-full px-4 py-3 pr-20 rounded-xl border border-slate-300 bg-white text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                {LAND_AREA_UNIT_SHORT_LABELS[selectedAreaUnit]}
              </span>
            </div>
          </div>

          {/* Unit Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Unit
            </label>
            <select
              value={selectedAreaUnit}
              onChange={(e) =>
                setSelectedAreaUnit(e.target.value as LandAreaUnit)
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
            >
              {(Object.keys(LAND_AREA_UNIT_LABELS) as LandAreaUnit[]).map(
                (unit) => (
                  <option key={unit} value={unit}>
                    {LAND_AREA_UNIT_LABELS[unit]}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Conversion Multi-View Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-6 gap-2">
          <div className="bg-white border border-[#FF9933]/30 rounded-xl p-3">
            <p className="text-[9px] uppercase tracking-wide font-bold text-slate-400">
              Sq. Yards
            </p>
            <p className="text-sm font-extrabold text-slate-900 mt-1">
              {formatArea(areaConversions.sqYards, 2)}
            </p>
          </div>

          <div className="bg-white border border-[#FF9933]/30 rounded-xl p-3">
            <p className="text-[9px] uppercase tracking-wide font-bold text-slate-400">
              Sq. Feet
            </p>
            <p className="text-sm font-extrabold text-slate-900 mt-1">
              {formatArea(areaConversions.sqFeet, 0)}
            </p>
          </div>

          <div className="bg-white border border-[#FF9933]/30 rounded-xl p-3">
            <p className="text-[9px] uppercase tracking-wide font-bold text-slate-400">
              Guntas
            </p>
            <p className="text-sm font-extrabold text-slate-900 mt-1">
              {formatArea(areaConversions.guntas, 2)}
            </p>
          </div>

          <div className="bg-white border border-[#FF9933]/30 rounded-xl p-3">
            <p className="text-[9px] uppercase tracking-wide font-bold text-slate-400">
              Cents
            </p>
            <p className="text-sm font-extrabold text-slate-900 mt-1">
              {formatArea(areaConversions.cents, 2)}
            </p>
          </div>

          <div className="bg-white border border-[#FF9933]/30 rounded-xl p-3">
            <p className="text-[9px] uppercase tracking-wide font-bold text-slate-400">
              Acres
            </p>
            <p className="text-sm font-extrabold text-slate-900 mt-1">
              {formatArea(areaConversions.acres, 4)}
            </p>
          </div>

          <div className="bg-white border border-[#FF9933]/30 rounded-xl p-3">
            <p className="text-[9px] uppercase tracking-wide font-bold text-slate-400">
              Hectares
            </p>
            <p className="text-sm font-extrabold text-slate-900 mt-1">
              {formatArea(areaConversions.hectares, 4)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 text-[10px] text-[#c75e0a]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            Your entered measurement is automatically converted to{' '}
            <strong>{formatArea(landAreaYards, 2)} square yards</strong> for
            BhoomiMitra&apos;s property records.
          </p>
        </div>

        {landAreaYards > 100000000 && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            ⚠️ Entered area exceeds maximum allowable limit of 100,000,000 sq.
            yards (~20,660 acres). Please check your entered value and selected
            unit.
          </div>
        )}
      </div>

      {/* Price & Valuation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Price per Square Yard *
          </label>
          <div className="relative">
            <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              min={1}
              value={pricePerYard}
              onChange={(e) => setPricePerYard(e.target.value)}
              placeholder="Enter price per sq. yd"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
            />
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Estimated Property Value
          </p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            ₹{Number(authoritativeFees.totalPrice || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {formatArea(landAreaYards, 2)} sq. yards × ₹
            {Number(pricePerYard || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Negotiable Checkbox */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={priceNegotiable}
          onChange={(e) => setPriceNegotiable(e.target.checked)}
          className="w-4 h-4 accent-[#FF9933]"
        />
        <span className="text-xs font-semibold text-slate-700">
          Price is negotiable with serious buyers
        </span>
      </label>
    </div>
  );
}
