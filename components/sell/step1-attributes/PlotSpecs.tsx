'use client';

import React from 'react';
import { Maximize2 } from 'lucide-react';
import { SellFormState, SellFormActions } from '@/types/sell-form';

interface PlotSpecsProps {
  state: SellFormState;
  actions: SellFormActions;
}

const PLOT_LAND_TYPES = [
  'RESIDENTIAL_PLOT',
  'COMMERCIAL_LAND',
  'INDUSTRIAL_PLOT',
  'INSTITUTIONAL',
  // Legacy compatibility
  'OPEN_PLOT',
  'GATED_COMMUNITY_PLOT',
];

export function PlotSpecs({ state, actions }: PlotSpecsProps) {
  const {
    landType,
    facing,
    plotLengthFt,
    plotWidthFt,
    boundaryWall,
    cornerPlot,
    gatedCommunity,
    approvals,
  } = state;

  const {
    setFacing,
    setPlotLengthFt,
    setPlotWidthFt,
    setBoundaryWall,
    setCornerPlot,
    setGatedCommunity,
    setApprovals,
    toggleItem,
  } = actions;
  if (!PLOT_LAND_TYPES.includes(landType)) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 shadow-xs">
      <div className="flex items-center gap-2.5 pb-3 border-b border-amber-100">
        <div className="w-8 h-8 rounded-lg bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
          <Maximize2 className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            Plot details
          </h3>
          <p className="text-[11px] text-slate-500">
            Add dimensions, facing, boundary status and approvals only where they apply.
          </p>
        </div>
      </div>

      {/* Plot Facing */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Plot facing
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'EAST', label: 'East Facing' },
            { id: 'WEST', label: 'West Facing' },
            { id: 'NORTH', label: 'North Facing' },
            { id: 'SOUTH', label: 'South Facing' },
            { id: 'NORTH_EAST', label: 'North-East' },
            { id: 'NORTH_WEST', label: 'North-West' },
            { id: 'SOUTH_EAST', label: 'South-East' },
            { id: 'SOUTH_WEST', label: 'South-West' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFacing(item.id)}
              className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                facing === item.id
                  ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plot Dimensions */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1.5">
          Plot Dimensions (Frontage × Depth in Feet)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] text-slate-500 mb-1 block font-medium">
              Frontage / Width (ft)
            </span>
            <input
              type="number"
              min={1}
              value={plotWidthFt}
              onChange={(e) => setPlotWidthFt(e.target.value)}
              placeholder="e.g. 30"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 mb-1 block font-medium">
              Depth / Length (ft)
            </span>
            <input
              type="number"
              min={1}
              value={plotLengthFt}
              onChange={(e) => setPlotLengthFt(e.target.value)}
              placeholder="e.g. 50"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
            />
          </div>
        </div>
        {plotWidthFt && plotLengthFt && (
          <p className="text-[11px] text-emerald-700 font-semibold mt-2">
            Dimensions: {plotWidthFt} ft × {plotLengthFt} ft ={' '}
            {(Number(plotWidthFt) * Number(plotLengthFt)).toLocaleString('en-IN')}{' '}
            sq. ft ({( (Number(plotWidthFt) * Number(plotLengthFt)) / 9 ).toFixed(1)} sq. yd)
          </p>
        )}
      </div>

      {/* Boundary & Enclosure Details */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Boundary / enclosure status
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: 'FULL_WALL', label: 'Full Concrete Boundary Wall Constructed' },
            { id: 'FENCING', label: 'Barbed Wire / Chainlink Fencing' },
            { id: 'DEMARCATED_STONES', label: 'Demarcated Survey Boundary Stones' },
            { id: 'OPEN_PLOT', label: 'Open / Unfenced Plot' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setBoundaryWall(item.id)}
              className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-colors ${
                boundaryWall === item.id
                  ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a] font-bold'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Corner Plot & Gated Community Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
          <input
            type="checkbox"
            checked={cornerPlot}
            onChange={(e) => setCornerPlot(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-[#FF9933]"
          />
          <div>
            <p className="text-xs font-bold text-slate-900">Corner Plot</p>
            <p className="text-[10px] text-slate-500">Plot has 2 or more road faces</p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
          <input
            type="checkbox"
            checked={gatedCommunity}
            onChange={(e) => setGatedCommunity(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-[#FF9933]"
          />
          <div>
            <p className="text-xs font-bold text-slate-900">Gated Layout</p>
            <p className="text-[10px] text-slate-500">Located in a secured/gated development</p>
          </div>
        </label>
      </div>

      {/* Layout Approvals */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Layout Sanctions &amp; Approvals
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            'HMDA Approved',
            'GHMC Approved',
            'DTCP Approved',
            'RERA Registered',
            'BDA Approved',
            'Panchayat Approved',
            'Revenue / Patta Record Available',
          ].map((appr) => {
            const selected = approvals.includes(appr);
            return (
              <button
                key={appr}
                type="button"
                onClick={() =>
                  toggleItem(
                    approvals,
                    appr,
                    setApprovals as (val: string[]) => void
                  )
                }
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  selected
                    ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                {selected ? '✓ ' : '+ '}
                {appr}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
