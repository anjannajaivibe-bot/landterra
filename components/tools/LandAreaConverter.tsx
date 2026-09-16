'use client';

import React, { useState } from 'react';
import { Calculator, ArrowRightLeft, Sparkles, Check, Info } from 'lucide-react';

type UnitKey = 'SQ_YARDS' | 'GUNTAS' | 'CENTS' | 'ACRES' | 'HECTARES' | 'BIGHA';

interface UnitDef {
  key: UnitKey;
  label: string;
  shortLabel: string;
  region: string;
  toSqYards: number;
}

const UNITS: UnitDef[] = [
  {
    key: 'SQ_YARDS',
    label: 'Square Yards (Gaj)',
    shortLabel: 'sq. yd',
    region: 'Standard National / Urban Layouts',
    toSqYards: 1,
  },
  {
    key: 'GUNTAS',
    label: 'Guntas',
    shortLabel: 'guntas',
    region: 'Telangana, Andhra Pradesh, Karnataka, Maharashtra',
    toSqYards: 121,
  },
  {
    key: 'CENTS',
    label: 'Cents',
    shortLabel: 'cents',
    region: 'Andhra Pradesh, Tamil Nadu, Kerala',
    toSqYards: 48.4,
  },
  {
    key: 'ACRES',
    label: 'Acres',
    shortLabel: 'acres',
    region: 'Agricultural Land across India (40 Guntas / 100 Cents)',
    toSqYards: 4840,
  },
  {
    key: 'HECTARES',
    label: 'Hectares',
    shortLabel: 'ha',
    region: 'Government Revenue Records (2.471 Acres)',
    toSqYards: 11959.9004,
  },
  {
    key: 'BIGHA',
    label: 'Bigha (Standard)',
    shortLabel: 'bigha',
    region: 'North & Central India (approx. 1,600 to 3,025 sq. yd)',
    toSqYards: 2420,
  },
];

export function LandAreaConverter() {
  const [inputValue, setInputValue] = useState<string>('1');
  const [selectedUnit, setSelectedUnit] = useState<UnitKey>('ACRES');

  const numericInput = parseFloat(inputValue) || 0;
  const currentUnitDef = UNITS.find((u) => u.key === selectedUnit) || UNITS[0];
  const areaInSqYards = numericInput * currentUnitDef.toSqYards;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#c75e0a] mb-1.5">
            <Calculator className="h-4 w-4 text-[#FF9933]" />
            <span>Land Measurement Tool</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
            Indian Land Area Measurement Converter
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant live conversions across Guntas, Cents, Acres, Square Yards &amp; Hectares
          </p>
        </div>

        <span className="self-start md:self-center inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#fff1dc] text-xs font-bold text-[#c75e0a] border border-[#FF9933]/20">
          <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
          <span>Real-time Formula Engine</span>
        </span>
      </div>

      {/* Input Controls */}
      <div className="pt-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
        <div className="sm:col-span-6">
          <label htmlFor="land-area-input" className="block text-xs font-bold text-slate-700 mb-1.5">
            Enter Land Area Value
          </label>
          <input
            id="land-area-input"
            name="landAreaValue"
            aria-label="Enter Land Area Value"
            type="number"
            min="0"
            step="any"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. 1"
            className="w-full h-[48px] px-4 py-2.5 rounded-2xl border border-slate-200 text-sm sm:text-base font-bold text-slate-900 focus:outline-[#FF9933] focus:border-[#FF9933] shadow-2xs"
          />
        </div>

        <div className="sm:col-span-6">
          <label htmlFor="land-area-unit-select" className="block text-xs font-bold text-slate-700 mb-1.5">
            Select Starting Unit
          </label>
          <div className="relative">
            <select
              id="land-area-unit-select"
              name="landAreaUnit"
              aria-label="Select Starting Unit"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value as UnitKey)}
              className="w-full h-[48px] px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-[#FF9933] focus:border-[#FF9933] shadow-2xs appearance-none cursor-pointer pr-10"
            >
              {UNITS.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label} ({u.shortLabel}) — {u.region}
                </option>
              ))}
            </select>
            <ArrowRightLeft className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
          Equivalent Land Conversions:
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {UNITS.map((u) => {
            const convertedValue = areaInSqYards / u.toSqYards;
            const isSelected = u.key === selectedUnit;

            let displayStr = '0';
            if (convertedValue > 0) {
              if (convertedValue >= 1000) {
                displayStr = convertedValue.toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                });
              } else if (convertedValue < 0.01) {
                displayStr = convertedValue.toFixed(4);
              } else {
                displayStr = convertedValue.toFixed(2).replace(/\.?0+$/, '');
              }
            }

            return (
              <div
                key={u.key}
                onClick={() => setSelectedUnit(u.key)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${isSelected
                  ? 'border-[#FF9933] bg-[#fffbf5] shadow-xs ring-2 ring-[#FF9933]/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="truncate">{u.label.replace(/\s*\(.*?\)\s*/, '')}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />}
                </div>

                <div className="mt-1.5 text-base font-black text-slate-900 truncate">
                  {displayStr}
                </div>

                <div className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
                  {u.shortLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          Formula reference: 1 Acre = 40 Guntas = 100 Cents = 4,840 Sq. Yards = 0.4046 Hectare.
        </span>
      </div>
    </div>
  );
}
