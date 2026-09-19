'use client';

import React from 'react';
import { UseSellFormReturn } from '@/types/sell-form';
import { TransactionType } from '@/types/property';
import { CategorySelector } from '../step1-attributes/CategorySelector';
import { PricingAreaSection } from '../step1-attributes/PricingAreaSection';
import { ResidentialSpecs } from '../step1-attributes/ResidentialSpecs';
import { PlotSpecs } from '../step1-attributes/PlotSpecs';
import { VillaSpecs } from '../step1-attributes/VillaSpecs';
import { CommercialSpecs } from '../step1-attributes/CommercialSpecs';
import { FarmlandSpecs } from '../step1-attributes/FarmlandSpecs';
import { HospitalitySpecs } from '../step1-attributes/HospitalitySpecs';
import { RentalSpecs } from '../step1-attributes/RentalSpecs';

interface Step1SpecsPricingProps {
  form: UseSellFormReturn;
}

const TRANSACTION_OPTIONS: Array<{
  value: TransactionType;
  label: string;
  helper: string;
}> = [
  {
    value: 'SALE',
    label: 'Sell',
    helper: 'Find a buyer',
  },
  {
    value: 'RENT',
    label: 'Rent',
    helper: 'Find a tenant',
  },
  {
    value: 'LEASE',
    label: 'Lease',
    helper: 'Offer a longer-term lease',
  },
];

export function Step1SpecsPricing({ form }: Step1SpecsPricingProps) {
  const { state, actions } = form;
  const {
    transactionType,
    title,
    description,
    roadAccess,
    landmarks,
  } = state;

  const {
    setTransactionType,
    setTitle,
    setDescription,
    setRoadAccess,
    setLandmarks,
  } = actions;

  return (
    <div className="p-5 sm:p-7 space-y-7 animate-in fade-in duration-150">
      <div>
        <p className="text-[11px] font-bold text-[#c75e0a]">
          Step 1 of 5
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-slate-950">
          Start with the property basics
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Tell us what you are offering. We will show only the fields relevant to that property and transaction.
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-800">
            I want to *
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            This controls the pricing fields and information buyers or tenants will see.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TRANSACTION_OPTIONS.map((option) => {
            const active = transactionType === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTransactionType(option.value)}
                className={`min-h-16 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? 'border-[#FF9933] bg-[#fff8ef] ring-1 ring-[#FF9933]/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span
                  className={`block text-sm font-extrabold ${
                    active ? 'text-[#a84f08]' : 'text-slate-900'
                  }`}
                >
                  {option.label}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">
                  {option.helper}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <CategorySelector state={state} actions={actions} />

      <section>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Listing title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          placeholder="Example: 300 sq. yd residential plot near Financial District"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
        />
        <div className="flex justify-between gap-3 mt-1.5">
          <p className="text-[10px] text-slate-500">
            Keep it factual: property type + area + locality works well.
          </p>
          <span className="text-[10px] text-slate-400 shrink-0">
            {title.length}/120
          </span>
        </div>
      </section>

      <PricingAreaSection state={state} actions={actions} />

      <ResidentialSpecs state={state} actions={actions} />
      <PlotSpecs state={state} actions={actions} />
      <VillaSpecs state={state} actions={actions} />
      <CommercialSpecs state={state} actions={actions} />
      <FarmlandSpecs state={state} actions={actions} />
      <HospitalitySpecs state={state} actions={actions} />
      <RentalSpecs state={state} actions={actions} />

      <section>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Description *
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          maxLength={3000}
          placeholder="Mention access road, surroundings, nearby facilities, development status and the strongest reasons someone should consider this property."
          className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
        />
        <div className="flex justify-between gap-3 mt-1.5">
          <p className="text-[10px] text-slate-500">
            Clear, specific details build more trust than promotional slogans.
          </p>
          <span className="text-[10px] text-slate-400 shrink-0">
            {description.length}/3000
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Road access
          </label>
          <select
            value={roadAccess}
            onChange={(event) => setRoadAccess(event.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          >
            <option value="30_FT_PLUS">30 ft or wider road</option>
            <option value="20_TO_30_FT">20-30 ft road</option>
            <option value="10_TO_20_FT">10-20 ft road</option>
            <option value="LESS_THAN_10_FT">Less than 10 ft road</option>
            <option value="NO_ROAD_ACCESS">No direct road access</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Nearby landmarks
          </label>
          <input
            type="text"
            value={landmarks}
            onChange={(event) => setLandmarks(event.target.value)}
            placeholder="Metro, school, hospital, highway"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
          <p className="text-[10px] text-slate-500 mt-1.5">
            Separate multiple landmarks with commas.
          </p>
        </div>
      </div>
    </div>
  );
}
