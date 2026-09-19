'use client';

import React from 'react';
import { Briefcase } from 'lucide-react';
import { SellFormState, SellFormActions } from '@/types/sell-form';

interface CommercialSpecsProps {
  state: SellFormState;
  actions: SellFormActions;
}

export function CommercialSpecs({ state, actions }: CommercialSpecsProps) {
  const {
    landType,
    commercialFitout,
    commercialWashrooms,
    powerLoadKva,
    suitableBusinesses,
  } = state;

  const {
    setCommercialFitout,
    setCommercialWashrooms,
    setPowerLoadKva,
    setSuitableBusinesses,
    toggleItem,
  } = actions;

  const isCommercialType = [
    'RETAIL_SHOP',
    'SHOWROOM',
    'SHOP_SHOWROOM',
    'OFFICE_SPACE',
    'COWORKING_SPACE',
    'SHOPPING_MALL',
    'WAREHOUSE_LAND',
    'INDUSTRIAL_BUILDING',
    'INDUSTRIAL_SHED',
  ].includes(landType);

  if (!isCommercialType) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 shadow-xs">
      <div className="flex items-center gap-2.5 pb-3 border-b border-amber-100">
        <div className="w-8 h-8 rounded-lg bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
          <Briefcase className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            Commercial property details
          </h3>
          <p className="text-[11px] text-slate-500">
            Add fit-out, washroom, power and suitable-use details where applicable.
          </p>
        </div>
      </div>

      {/* Fitout Condition */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Fitout / Furnishing Condition
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'BARE_SHELL', label: 'Bare Shell / Core' },
            { id: 'WARM_SHELL', label: 'Warm Shell' },
            { id: 'FULLY_FURNISHED', label: 'Fully Furnished (Plug & Play)' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCommercialFitout(f.id)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                commercialFitout === f.id
                  ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a] font-bold'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Washroom & Power */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Washroom Facility
          </label>
          <select
            value={commercialWashrooms}
            onChange={(e) => setCommercialWashrooms(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
          >
            <option value="NOT_SPECIFIED">Not specified</option>
            <option value="PRIVATE">Private attached washroom</option>
            <option value="COMMON">Common Floor Washrooms</option>
            <option value="BOTH">Both Private & Common</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Power Load / Sanction
          </label>
          <input
            type="text"
            value={powerLoadKva}
            onChange={(e) => setPowerLoadKva(e.target.value)}
            placeholder="e.g. 15 KVA / Dedicated Transformer"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
        </div>
      </div>

      {/* Suitable For */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Suitable Business Uses
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            'IT / Software Company',
            'Corporate Office',
            'Retail Store / Showroom',
            'Doctor Clinic / Diagnostics',
            'Bank / ATM Center',
            'Restaurant / Cafe',
            'Warehouse / Logistics',
            'Manufacturing / Workshop',
          ].map((biz) => {
            const selected = suitableBusinesses.includes(biz);
            return (
              <button
                key={biz}
                type="button"
                onClick={() => toggleItem(suitableBusinesses, biz, setSuitableBusinesses)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  selected
                    ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                {selected ? '✓ ' : '+ '}{biz}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
