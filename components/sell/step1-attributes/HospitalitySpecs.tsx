'use client';

import React from 'react';
import { Palmtree } from 'lucide-react';
import { SellFormState, SellFormActions } from '@/types/sell-form';

interface HospitalitySpecsProps {
  state: SellFormState;
  actions: SellFormActions;
}

export function HospitalitySpecs({ state, actions }: HospitalitySpecsProps) {
  const {
    landType,
    totalRooms,
    eventLawnCapacity,
    hospitalityFeatures,
  } = state;

  const {
    setTotalRooms,
    setEventLawnCapacity,
    setHospitalityFeatures,
    toggleItem,
  } = actions;

  const isHospitality = ['RESORT', 'HOTEL', 'SERVICE_APARTMENT', 'GUEST_HOUSE'].includes(landType);

  if (!isHospitality) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 shadow-xs">
      <div className="flex items-center gap-2.5 pb-3 border-b border-amber-100">
        <div className="w-8 h-8 rounded-lg bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
          <Palmtree className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            Hospitality, Resort &amp; Retreat Infrastructure
          </h3>
          <p className="text-[11px] text-slate-500">
            Room capacity, event lawns, guest recreation, and hospitality amenities.
          </p>
        </div>
      </div>

      {/* Rooms and Event Capacity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Total Rooms / Cottages / Keys *
          </label>
          <input
            type="text"
            value={totalRooms}
            onChange={(e) => setTotalRooms(e.target.value)}
            placeholder="e.g. 24 Luxury Cottages / 40 Keys"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Event Lawn / Banquet Capacity
          </label>
          <input
            type="text"
            value={eventLawnCapacity}
            onChange={(e) => setEventLawnCapacity(e.target.value)}
            placeholder="e.g. 600 Guests / 15,000 sq.ft Party Lawn"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
        </div>
      </div>

      {/* Hospitality Features */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Hospitality &amp; Guest Amenities
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            'Swimming Pool',
            'Restaurant / Kitchen Setup',
            'Banquet / Event Lawn',
            'Guest Parking (50+ Cars)',
            'Spa & Wellness Pavilion',
            'EV Charging Station',
            '100% Generator Backup',
            'Children Play Park',
            'Tourism / Bar License Sanctioned',
            'Conference / Meeting Room',
          ].map((feat) => {
            const selected = hospitalityFeatures.includes(feat);
            return (
              <button
                key={feat}
                type="button"
                onClick={() => toggleItem(hospitalityFeatures, feat, setHospitalityFeatures)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  selected
                    ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                {selected ? '✓ ' : '+ '}{feat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
