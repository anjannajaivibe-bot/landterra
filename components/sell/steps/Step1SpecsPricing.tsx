'use client';

import React from 'react';
import { UseSellFormReturn } from '@/types/sell-form';
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

export function Step1SpecsPricing({ form }: Step1SpecsPricingProps) {
  const { state, actions } = form;
  const { title, description, roadAccess, landmarks } = state;
  const { setTitle, setDescription, setRoadAccess, setLandmarks } = actions;

  return (
    <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">
          Property Details &amp; Pricing
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Provide land specifications, pricing, and measurements.
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Listing Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Example: 300 Sq. Yards Residential Plot Near Financial District"
          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
        />
        <div className="flex justify-between mt-1">
          <p className="text-[10px] text-slate-400">
            Make the location and property type clear.
          </p>
          <span className="text-[10px] text-slate-400">
            {title.length}/120
          </span>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Property Description *
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          maxLength={3000}
          placeholder="Describe road access, surroundings, development status, nearby facilities, ownership details, and anything else a genuine buyer should know."
          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
        />
        <div className="text-right text-[10px] text-slate-400 mt-1">
          {description.length}/3000
        </div>
      </div>

      {/* Multi-Unit Land Area & Pricing Section */}
      <PricingAreaSection state={state} actions={actions} />

      {/* Category Tabs & Property Type Selection */}
      <CategorySelector state={state} actions={actions} />

      {/* Context-Specific Dynamic Specifications */}
      <ResidentialSpecs state={state} actions={actions} />
      <PlotSpecs state={state} actions={actions} />
      <VillaSpecs state={state} actions={actions} />
      <CommercialSpecs state={state} actions={actions} />
      <FarmlandSpecs state={state} actions={actions} />
      <HospitalitySpecs state={state} actions={actions} />
      <RentalSpecs state={state} actions={actions} />

      {/* Road Access */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Road Access
        </label>
        <select
          value={roadAccess}
          onChange={(event) => setRoadAccess(event.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
        >
          <option value="30_FT_PLUS">30 ft or wider road</option>
          <option value="20_TO_30_FT">20–30 ft road</option>
          <option value="10_TO_20_FT">10–20 ft road</option>
          <option value="LESS_THAN_10_FT">Less than 10 ft road</option>
          <option value="NO_ROAD_ACCESS">No direct road access</option>
        </select>
      </div>

      {/* Landmarks */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Nearby Landmarks
        </label>
        <input
          type="text"
          value={landmarks}
          onChange={(event) => setLandmarks(event.target.value)}
          placeholder="Example: Metro Station, ORR, School, Hospital"
          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
        />
        <p className="text-[10px] text-slate-400 mt-1">
          Separate multiple landmarks with commas.
        </p>
      </div>
    </div>
  );
}
