'use client';

import React from 'react';
import { Trees } from 'lucide-react';
import { SellFormState, SellFormActions } from '@/types/sell-form';

interface FarmlandSpecsProps {
  state: SellFormState;
  actions: SellFormActions;
}

export function FarmlandSpecs({ state, actions }: FarmlandSpecsProps) {
  const {
    landType,
    soilType,
    waterSources,
    electricityPhase,
    farmFencing,
    plantations,
  } = state;

  const {
    setSoilType,
    setWaterSources,
    setElectricityPhase,
    setFarmFencing,
    setPlantations,
    toggleItem,
  } = actions;

  const isFarmland =
    landType === 'AGRICULTURAL_LAND' ||
    landType === 'FARMLAND_PLOT' ||
    landType === 'FARM_HOUSE_LAND';

  if (!isFarmland) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 shadow-xs">
      <div className="flex items-center gap-2.5 pb-3 border-b border-amber-100">
        <div className="w-8 h-8 rounded-lg bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
          <Trees className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            Farmland, Soil &amp; Water Infrastructure
          </h3>
          <p className="text-[11px] text-slate-500">
            Agricultural attributes, soil quality, irrigation sources, and existing plantations.
          </p>
        </div>
      </div>

      {/* Soil Type */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Soil Quality / Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'RED_SOIL', label: 'Red Soil (Fertile)' },
            { id: 'BLACK_COTTON', label: 'Black Cotton' },
            { id: 'ALLUVIAL', label: 'Alluvial Soil' },
            { id: 'LOAMY', label: 'Loamy / Sandy' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSoilType(item.id)}
              className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                soilType === item.id
                  ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Water Sources */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Water &amp; Irrigation Sources
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            'Dedicated Borewell',
            'Canal / River Irrigation',
            'Drip Irrigation System',
            'Open Agricultural Well',
            'Pond / Water Reservoir',
          ].map((src) => {
            const selected = waterSources.includes(src);
            return (
              <button
                key={src}
                type="button"
                onClick={() => toggleItem(waterSources, src, setWaterSources)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  selected
                    ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                {selected ? '✓ ' : '+ '}{src}
              </button>
            );
          })}
        </div>
      </div>

      {/* Electricity & Fencing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Agricultural Electricity
          </label>
          <select
            value={electricityPhase}
            onChange={(e) => setElectricityPhase(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
          >
            <option value="3_PHASE">3-Phase Agricultural Power</option>
            <option value="SINGLE_PHASE">Single Phase Power</option>
            <option value="SOLAR">Solar Power Installed</option>
            <option value="NONE">No Direct Connection</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Perimeter Fencing
          </label>
          <select
            value={farmFencing}
            onChange={(e) => setFarmFencing(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
          >
            <option value="CHAINLINK">Fully Fenced (Chainlink / Barbed Wire)</option>
            <option value="PARTIAL">Partially Fenced</option>
            <option value="UNFENCED">Open / Unfenced</option>
          </select>
        </div>
      </div>

      {/* Plantations */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Existing Plantations / Crops (Optional)
        </label>
        <input
          type="text"
          value={plantations}
          onChange={(e) => setPlantations(e.target.value)}
          placeholder="e.g. 50 Mango Trees, Teakwood, Guava, Organic Vegetables"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
        />
      </div>
    </div>
  );
}
