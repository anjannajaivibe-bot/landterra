'use client';

import React from 'react';
import { Home, SlidersHorizontal, Check } from 'lucide-react';
import { SellFormState, SellFormActions } from '@/types/sell-form';
import { getPropertyTypeLabel } from '@/config/constants';

interface VillaSpecsProps {
  state: SellFormState;
  actions: SellFormActions;
}

function formatArea(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function VillaSpecs({ state, actions }: VillaSpecsProps) {
  const {
    landType,
    skipOptionalFeatures,
    villaType,
    bhk,
    villaFloors,
    bathrooms,
    balconies,
    superBuiltUpAreaSqFt,
    carpetAreaSqFt,
    authoritativeFees,
    facing,
    vastuCompliant,
    additionalRooms,
    villaPrivateFeatures,
    parkingSlots,
    furnishingStatus,
    furnishingDetails,
    possessionStatus,
    ageOfProperty,
    selectedAmenities,
  } = state;

  const {
    setSkipOptionalFeatures,
    setVillaType,
    setBhk,
    setVillaFloors,
    setBathrooms,
    setBalconies,
    setSuperBuiltUpAreaSqFt,
    setCarpetAreaSqFt,
    setFacing,
    setVastuCompliant,
    setAdditionalRooms,
    setVillaPrivateFeatures,
    toggleItem,
    setParkingSlots,
    setFurnishingStatus,
    setFurnishingDetails,
    setPossessionStatus,
    setAgeOfProperty,
    setSelectedAmenities,
  } = actions;

  if (![
    'VILLA',
    'INDEPENDENT_HOUSE',
    'TOWNHOUSE',
    'DUPLEX',
    'FARMHOUSE',
    // Legacy compatibility
    'HOUSE_VILLA',
    'FARM_HOUSE_LAND',
  ].includes(landType)) {
    return null;
  }

  const landAreaYards = authoritativeFees.landAreaYards;

  return (
    <div className="rounded-2xl border-2 border-amber-300/80 bg-[#fffdfa] p-5 sm:p-7 space-y-7 animate-in fade-in duration-200 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:row sm:items-center justify-between gap-3 pb-4 border-b border-amber-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0 shadow-xs">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">
                {getPropertyTypeLabel(landType)} details
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Add only the details that apply to this property. Optional features can be skipped.
            </p>
          </div>
        </div>

        {/* Quick Option: Skip/Minimal Toggle */}
        <button
          type="button"
          onClick={() => setSkipOptionalFeatures(!skipOptionalFeatures)}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            skipOptionalFeatures
              ? 'bg-amber-100 border-amber-300 text-amber-900'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF9933]" />
          {skipOptionalFeatures ? 'Expand All Villa Features' : 'Keep Minimal (Skip Optional Features)'}
        </button>
      </div>

      {!skipOptionalFeatures ? (
        <>
          {/* 1. Villa Style & Architecture */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Villa Style / Architecture</span>
                <span className="text-[10px] font-normal text-slate-400">(Click to select or change)</span>
              </label>
              {villaType !== 'NOT_SPECIFIED' && (
                <button
                  type="button"
                  onClick={() => setVillaType('NOT_SPECIFIED')}
                  className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                >
                  ✕ Don&apos;t specify style
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'GATED_VILLA', label: 'Gated Community Luxury Villa', desc: 'Private secured enclave with clubhouse' },
                { id: 'INDEPENDENT_HOUSE', label: 'Independent Bungalow / Kothi', desc: 'Standalone home with private compound' },
                { id: 'DUPLEX_VILLA', label: 'Duplex Villa (G+1)', desc: 'Two-floor luxury villa with internal stairs' },
                { id: 'TRIPLEX_VILLA', label: 'Triplex Villa (G+2 / G+3)', desc: 'Three-floor sprawling villa' },
                { id: 'ROW_HOUSE', label: 'Row House / Townhouse', desc: 'Modern attached villa with dedicated parking' },
                { id: 'FARMHOUSE_VILLA', label: 'Farmhouse / Retreat Villa', desc: 'Spacious countryside holiday home' },
              ].map((item) => {
                const isSelected = villaType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setVillaType(isSelected ? 'NOT_SPECIFIED' : item.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FF9933] bg-[#fff9f0] text-[#7a3705] ring-2 ring-[#FF9933]/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold">{item.label}</p>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#FF9933] shrink-0 ml-1" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Bedrooms (BHK), Structure Elevation & Total Floors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* BHK */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800">
                  Bedroom configuration (BHK)
                </label>
                {bhk !== 'NOT_SPECIFIED' && (
                  <button
                    type="button"
                    onClick={() => setBhk('NOT_SPECIFIED')}
                    className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    ✕ Don&apos;t specify
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', '6+ BHK'].map((item) => {
                  const isSelected = bhk === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setBhk(isSelected ? 'NOT_SPECIFIED' : item)}
                      className={`py-2.5 px-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Structure Floors */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800">
                  Structure Floors / Elevation
                </label>
                {villaFloors !== 'NOT_SPECIFIED' && (
                  <button
                    type="button"
                    onClick={() => setVillaFloors('NOT_SPECIFIED')}
                    className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    ✕ Don&apos;t specify
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'G', label: 'Ground (G)' },
                  { id: 'G_PLUS_1', label: 'G + 1 (Duplex)' },
                  { id: 'G_PLUS_2', label: 'G + 2 (Triplex)' },
                  { id: 'G_PLUS_3', label: 'G + 3 Floors' },
                ].map((item) => {
                  const isSelected = villaFloors === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVillaFloors(isSelected ? 'NOT_SPECIFIED' : item.id)}
                      className={`py-2.5 px-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Bathrooms & Balconies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Bathrooms
                </label>
                {bathrooms > 0 && (
                  <button
                    type="button"
                    onClick={() => setBathrooms(0)}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    ✕ Don&apos;t specify
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setBathrooms(bathrooms === num ? 0 : num)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      bathrooms === num
                        ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {num}{num === 6 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Balconies / Sit-outs
                </label>
                {balconies >= 0 && (
                  <button
                    type="button"
                    onClick={() => setBalconies(-1)}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    ✕ Don&apos;t specify
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setBalconies(balconies === num ? -1 : num)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      balconies === num
                        ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {num}{num === 5 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Built-up Area, Carpet Area & Plot Land Sync */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Built-up Area (sq. ft)
              </label>
              <input
                type="number"
                value={superBuiltUpAreaSqFt}
                onChange={(e) => setSuperBuiltUpAreaSqFt(e.target.value)}
                placeholder="e.g. 3400"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Carpet Area (sq. ft)
              </label>
              <input
                type="number"
                value={carpetAreaSqFt}
                onChange={(e) => setCarpetAreaSqFt(e.target.value)}
                placeholder="e.g. 2800"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Dedicated Plot Area
              </label>
              <div className="px-4 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-sm font-bold text-[#7a3705] flex items-center justify-between">
                <span>{formatArea(landAreaYards, 2)}</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({(landAreaYards * 9).toLocaleString('en-IN')} sq. ft)
                </span>
              </div>
            </div>
          </div>

          {/* 5. Facing Direction & Vastu Compliance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Main Entrance Facing Direction
              </label>
              {facing !== 'NOT_SPECIFIED' && (
                <button
                  type="button"
                  onClick={() => setFacing('NOT_SPECIFIED')}
                  className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                >
                  ✕ Don&apos;t specify facing
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'EAST', label: 'East Facing' },
                { id: 'NORTH', label: 'North Facing' },
                { id: 'WEST', label: 'West Facing' },
                { id: 'SOUTH', label: 'South Facing' },
                { id: 'NORTH_EAST', label: 'North-East (Ishanya)' },
                { id: 'NORTH_WEST', label: 'North-West (Vayavya)' },
                { id: 'SOUTH_EAST', label: 'South-East (Agneya)' },
                { id: 'SOUTH_WEST', label: 'South-West (Nairuti)' },
              ].map((item) => {
                const isSelected = facing === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFacing(isSelected ? 'NOT_SPECIFIED' : item.id)}
                    className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* 100% Vastu Compliant Toggle */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 cursor-pointer hover:bg-emerald-50 transition-colors">
              <input
                type="checkbox"
                checked={vastuCompliant}
                onChange={(e) => setVastuCompliant(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-emerald-600"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-emerald-950">
                    Vastu compliant (seller-declared)
                  </span>

                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Select this only if you want to declare the property as Vastu compliant.
                </p>
              </div>
            </label>
          </div>

          {/* 6. Dedicated Additional Rooms (Pooja, Servant, Study, Theatre, etc.) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Dedicated Additional Rooms ({additionalRooms.length} selected)
              </label>
              {additionalRooms.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAdditionalRooms([])}
                  className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  ✕ Deselect all rooms
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'Pooja Room', label: '🪔 Pooja Room (Mandir)' },
                { id: 'Servant Room', label: '🧹 Servant Room / Maid Quarter' },
                { id: 'Study Room', label: '💼 Study / Home Office' },
                { id: 'Store Room', label: '📦 Dedicated Store Room' },
                { id: 'Home Theatre', label: '🎬 Home Cinema / Theatre Lounge' },
                { id: 'Private Gym Room', label: '🏋️ Private Gym Space' },
                { id: 'Utility & Dry Balcony', label: '🧺 Utility & Wash Area' },
                { id: 'Covered Verandah', label: '🌅 Covered Sit-out / Verandah' },
              ].map((room) => {
                const selected = additionalRooms.includes(room.id);
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => toggleItem(additionalRooms, room.id, setAdditionalRooms)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selected
                        ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a] shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}{room.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Exclusive Private Villa Features (Garden, Pool, Roof Rights, Car Porch, etc.) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Exclusive Private Villa Grounds &amp; Features ({villaPrivateFeatures.length} selected)
              </label>
              {villaPrivateFeatures.length > 0 && (
                <button
                  type="button"
                  onClick={() => setVillaPrivateFeatures([])}
                  className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  ✕ Deselect all private features
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'Private Garden / Lawn', label: '🌳 Private Landscaped Garden / Lawn' },
                { id: 'Private Swimming Pool', label: '🏊 Private Swimming Pool / Plunge Pool' },
                { id: 'Private Terrace / Roof Rights', label: '☀️ Private Terrace with 100% Roof Rights' },
                { id: 'Covered Car Porch (2+ Cars)', label: '🚗 Covered Car Porch (2+ Cars)' },
                { id: 'Private Elevator / Lift', label: '🛗 Private Home Elevator / Lift Provision' },
                { id: 'Solar Rooftop & Water Heater', label: '⚡ Solar Panels & Solar Water Heater' },
                { id: 'Dedicated Private Borewell', label: '💧 Dedicated Private Borewell & Motor' },
                { id: 'Underground Sump & Overhead Tank', label: '🚰 Underground Sump + Overhead Tank' },
                { id: 'Perimeter Compound Wall & Gate', label: '🧱 Boundary Compound Wall & Personal Gate' },
                { id: 'EV Car Charging Station', label: '🔌 EV Car Charging Point in Porch' },
                { id: 'Separate Servant Entrance', label: '🚪 Dedicated Servant / Service Entrance' },
                { id: 'Rainwater Harvesting Pit', label: '🌧️ Rainwater Harvesting Pit' },
              ].map((feat) => {
                const selected = villaPrivateFeatures.includes(feat.id);
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => toggleItem(villaPrivateFeatures, feat.id, setVillaPrivateFeatures)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selected
                        ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a] shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}{feat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8. Reserved Car Parking */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">
                Reserved Car Parking
              </label>
              {parkingSlots !== 'NOT_SPECIFIED' && (
                <button
                  type="button"
                  onClick={() => setParkingSlots('NOT_SPECIFIED')}
                  className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                >
                  ✕ Don&apos;t specify parking
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'NOT_SPECIFIED', label: 'Don\'t want to specify' },
                { id: '1_COVERED', label: '1 Covered Car Porch' },
                { id: '2_COVERED', label: '2 Covered Car Porch' },
                { id: '3_PLUS_COVERED', label: '3+ Covered Car Porch' },
                { id: 'OPEN', label: 'Open Driveway Parking' },
                { id: 'NONE', label: 'No Dedicated Parking' },
              ].map((p) => {
                const isSelected = parkingSlots === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setParkingSlots(p.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 9. Furnishing Status & Inclusions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Furnishing Status
              </label>
              {furnishingStatus !== 'NOT_SPECIFIED' && (
                <button
                  type="button"
                  onClick={() => setFurnishingStatus('NOT_SPECIFIED')}
                  className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                >
                  ✕ Don&apos;t specify
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'NOT_SPECIFIED', label: 'Don\'t specify' },
                { id: 'UNFURNISHED', label: 'Unfurnished' },
                { id: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
                { id: 'FULLY_FURNISHED', label: 'Fully Furnished' },
              ].map((f) => {
                const isSelected = furnishingStatus === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFurnishingStatus(f.id)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Modular Inclusions (when Semi or Fully Furnished) */}
            {(furnishingStatus === 'SEMI_FURNISHED' || furnishingStatus === 'FULLY_FURNISHED') && (
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Included Fittings &amp; Inclusions ({furnishingDetails.length} selected)
                  </span>
                  {furnishingDetails.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFurnishingDetails([])}
                      className="text-[10px] text-rose-600 font-semibold cursor-pointer"
                    >
                      ✕ Clear inclusions
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Modular Kitchen with Chimney',
                    'Built-in Floor-to-Ceiling Wardrobes',
                    'Split / VRV Air Conditioners',
                    'Italian Marble / Vitrified Flooring',
                    'Teakwood Main Door & Frames',
                    'Designer False Ceiling & LED Lights',
                    'Bathroom Geysers & Shower Cubicles',
                    'Smart Digital Door Lock',
                    'RO Water Purifier',
                    'Jacuzzi / Premium Sanitaryware',
                  ].map((inc) => {
                    const sel = furnishingDetails.includes(inc);
                    return (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => toggleItem(furnishingDetails, inc, setFurnishingDetails)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                          sel
                            ? 'border-[#FF9933] bg-[#FF9933] text-white'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        {sel ? '✓ ' : '+ '}{inc}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 10. Possession Status & Property Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Possession Status
                </label>
                {possessionStatus !== 'NOT_SPECIFIED' && (
                  <button
                    type="button"
                    onClick={() => setPossessionStatus('NOT_SPECIFIED')}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    ✕ Don&apos;t specify
                  </button>
                )}
              </div>
              <select
                value={possessionStatus}
                onChange={(e) => setPossessionStatus(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
              >
                <option value="NOT_SPECIFIED">Don&apos;t want to specify</option>
                <option value="READY_TO_MOVE">Ready to Move</option>
                <option value="UNDER_CONSTRUCTION">Under Construction</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Age of Construction / Property
                </label>
                {ageOfProperty !== 'NOT_SPECIFIED' && (
                  <button
                    type="button"
                    onClick={() => setAgeOfProperty('NOT_SPECIFIED')}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    ✕ Don&apos;t specify
                  </button>
                )}
              </div>
              <select
                value={ageOfProperty}
                onChange={(e) => setAgeOfProperty(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
              >
                <option value="NOT_SPECIFIED">Don&apos;t want to specify</option>
                <option value="NEW">Brand New / Under 1 Year</option>
                <option value="1_TO_5_YEARS">1 to 5 Years Old</option>
                <option value="5_TO_10_YEARS">5 to 10 Years Old</option>
                <option value="10_PLUS_YEARS">10+ Years Old</option>
              </select>
            </div>
          </div>

          {/* 11. Gated Community / Enclave Amenities */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Gated Community / Enclave Amenities ({selectedAmenities.length} selected)
              </label>
              {selectedAmenities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedAmenities([])}
                  className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  ✕ Deselect all community amenities
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                '24/7 Security Guard & CCTV',
                'Grand Clubhouse & Banquet Hall',
                'Common Swimming Pool & Kids Pool',
                'Modern Gymnasium',
                'Children\'s Play Area & Sandpit',
                'Jogging & Cycling Track',
                'Tennis / Badminton Court',
                '100% DG Power Backup',
                '30ft / 40ft Wide Internal Concrete Roads',
                'Underground Cabling & Drainage',
                'Rainwater Harvesting System',
                'Boom Barrier & RFID Entry Gate',
              ].map((amenity) => {
                const selected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleItem(selectedAmenities, amenity, setSelectedAmenities)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}{amenity}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
          <p className="text-xs font-bold text-slate-700">
            Optional villa specifications skipped for a minimal listing.
          </p>
          <p className="text-[11px] text-slate-500">
            Your listing can be submitted with the basic details. Expand the optional section at any time to add more features.
          </p>
        </div>
      )}
    </div>
  );
}
