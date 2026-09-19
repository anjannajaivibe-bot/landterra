'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { SellFormState, SellFormActions } from '@/types/sell-form';

interface ResidentialSpecsProps {
  state: SellFormState;
  actions: SellFormActions;
}

export function ResidentialSpecs({ state, actions }: ResidentialSpecsProps) {
  const {
    landType,
    bhk,
    floorNumber,
    totalFloors,
    furnishingStatus,
    bathrooms,
    balconies,
    carpetAreaSqFt,
    superBuiltUpAreaSqFt,
    facing,
    parkingSlots,
    selectedAmenities,
  } = state;

  const {
    setBhk,
    setFloorNumber,
    setTotalFloors,
    setFurnishingStatus,
    setBathrooms,
    setBalconies,
    setCarpetAreaSqFt,
    setSuperBuiltUpAreaSqFt,
    setFacing,
    setParkingSlots,
    setSelectedAmenities,
    toggleItem,
  } = actions;

  if (!['FLAT', 'PENTHOUSE', 'SERVICE_APARTMENT'].includes(landType)) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 shadow-xs">
      <div className="flex items-center gap-2.5 pb-3 border-b border-amber-100">
        <div className="w-8 h-8 rounded-lg bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            Apartment & Tower Specifications
          </h3>
          <p className="text-[11px] text-slate-500">
            Configuration, floor details, areas, and society amenities for apartment buyers.
          </p>
        </div>
      </div>

      {/* Bedroom Configuration (BHK) */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Bedrooms Configuration (BHK) *
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setBhk(item)}
              className={`py-2.5 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                bhk === item
                  ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Floor Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Floor Number *
          </label>
          <input
            type="text"
            value={floorNumber}
            onChange={(e) => setFloorNumber(e.target.value)}
            placeholder="e.g. 4th Floor"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Total Floors in Tower *
          </label>
          <input
            type="text"
            value={totalFloors}
            onChange={(e) => setTotalFloors(e.target.value)}
            placeholder="e.g. 14 Floors"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
        </div>
      </div>

      {/* Bathrooms & Balconies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Bathrooms
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setBathrooms(num)}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                  bathrooms === num
                    ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                {num}
                {num === 5 ? '+' : ''}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Balconies
          </label>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setBalconies(num)}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                  balconies === num
                    ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                {num}
                {num === 4 ? '+' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Furnishing Status */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Furnishing Status
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'UNFURNISHED', label: 'Unfurnished' },
            { id: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
            { id: 'FULLY_FURNISHED', label: 'Fully Furnished' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFurnishingStatus(f.id)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                furnishingStatus === f.id
                  ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a] font-bold'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Super Built-Up & Carpet Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Super Built-up Area (sq. ft)
          </label>
          <input
            type="number"
            min={100}
            value={superBuiltUpAreaSqFt}
            onChange={(e) => setSuperBuiltUpAreaSqFt(e.target.value)}
            placeholder="e.g. 1450"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Carpet Area (sq. ft)
          </label>
          <input
            type="number"
            min={100}
            value={carpetAreaSqFt}
            onChange={(e) => setCarpetAreaSqFt(e.target.value)}
            placeholder="e.g. 1120"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
        </div>
      </div>

      {/* Facing & Reserved Parking */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Main Door Facing
          </label>
          <select
            value={facing}
            onChange={(e) => setFacing(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
          >
            <option value="NOT_SPECIFIED">Don&apos;t want to specify</option>
            <option value="EAST">East Facing</option>
            <option value="WEST">West Facing</option>
            <option value="NORTH">North Facing</option>
            <option value="SOUTH">South Facing</option>
            <option value="NORTH_EAST">North-East Facing</option>
            <option value="NORTH_WEST">North-West Facing</option>
            <option value="SOUTH_EAST">South-East Facing</option>
            <option value="SOUTH_WEST">South-West Facing</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Reserved Car Parking
          </label>
          <select
            value={parkingSlots}
            onChange={(e) => setParkingSlots(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
          >
            <option value="NOT_SPECIFIED">Don&apos;t want to specify</option>
            <option value="1_COVERED">1 Covered Car Parking</option>
            <option value="2_COVERED">2 Covered Car Parkings</option>
            <option value="OPEN">Open Car Parking</option>
            <option value="NONE">No Reserved Parking</option>
          </select>
        </div>
      </div>

      {/* Society Amenities */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-800">
            Society &amp; Apartment Amenities ({selectedAmenities.length} selected)
          </label>
          {selectedAmenities.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedAmenities([])}
              className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              ✕ Deselect all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            'Lift / Elevator',
            '24/7 Security & CCTV',
            '100% Power Backup',
            'Clubhouse',
            'Swimming Pool',
            'Gymnasium',
            "Children's Play Area",
            'Gated Community',
            'Piped Gas Line',
            'Intercom',
            'Rainwater Harvesting',
            'EV Charging Station',
          ].map((amenity) => {
            const selected = selectedAmenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() =>
                  toggleItem(
                    selectedAmenities,
                    amenity,
                    setSelectedAmenities as (val: string[]) => void
                  )
                }
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  selected
                    ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                {selected ? '✓ ' : '+ '}
                {amenity}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
