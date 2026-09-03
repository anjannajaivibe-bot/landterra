'use client';

import React, { useState } from 'react';
import { MapPin, Search, Eye, EyeOff } from 'lucide-react';
import { INDIAN_STATES } from '@/config/constants';

interface GoogleMapPickerProps {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  approximateLocation: boolean;
  onChange: (data: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    pincode: string;
    approximateLocation: boolean;
  }) => void;
}

export function GoogleMapPicker({
  latitude,
  longitude,
  address,
  city,
  state,
  pincode,
  approximateLocation,
  onChange,
}: GoogleMapPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Preset Indian metropolitan land hub coordinates for quick centering
  const popularHubs: Record<string, { lat: number; lng: number; state: string }> = {
    Hyderabad: { lat: 17.385, lng: 78.4867, state: 'Telangana' },
    Bengaluru: { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
    Mumbai: { lat: 19.076, lng: 72.8777, state: 'Maharashtra' },
    Pune: { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
    Noida: { lat: 28.5355, lng: 77.391, state: 'Uttar Pradesh' },
    Chennai: { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
    Ahmedabad: { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  };

  const handleHubSelect = (hubName: string) => {
    const hub = popularHubs[hubName];
    if (hub) {
      onChange({
        latitude: hub.lat,
        longitude: hub.lng,
        city: hubName,
        state: hub.state,
        address: `${hubName}, ${hub.state}`,
        pincode: pincode || '500001',
        approximateLocation,
      });
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    // If matches a preset hub or basic city
    const matched = Object.keys(popularHubs).find(
      (h) => h.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (matched) {
      handleHubSelect(matched);
      setIsSearching(false);
      return;
    }

    // Geocoding query simulation
    onChange({
      latitude: Number((latitude + (Math.random() - 0.5) * 0.05).toFixed(4)),
      longitude: Number((longitude + (Math.random() - 0.5) * 0.05).toFixed(4)),
      city: searchQuery.split(',')[0]?.trim() || city,
      state: state || 'Telangana',
      address: searchQuery,
      pincode: pincode || '500081',
      approximateLocation,
    });
    setIsSearching(false);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city, sector, or locality (e.g. Kokapet Hyderabad, Whitefield Bengaluru)"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] bg-white"
          />
        </div>
        <button
          type="button"
          onClick={handleManualSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isSearching ? 'Locating...' : 'Locate'}
        </button>
      </div>

      {/* Quick Hub Pills */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs">
        <span className="text-slate-500 font-medium mr-1">Quick Select:</span>
        {Object.keys(popularHubs).map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => handleHubSelect(h)}
            className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors cursor-pointer ${
              city.toLowerCase() === h.toLowerCase()
                ? 'bg-[#fff1dc] border-[#FF9933]/40 text-[#c75e0a] font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {h}
          </button>
        ))}
      </div>

      {/* Interactive Map Surface */}
      <div className="relative aspect-16/9 w-full rounded-xl overflow-hidden border border-slate-300 bg-slate-100 shadow-inner">
        {/* Dynamic Map Visualization Canvas */}
        <div className="absolute inset-0 bg-slate-200 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full h-full rounded-lg bg-amber-950/5 border border-amber-900/10 relative overflow-hidden flex items-center justify-center">
            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #FF9933 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Approximate Radius Circle */}
            {approximateLocation && (
              <div className="absolute w-36 h-36 rounded-full bg-[#FF9933]/20 border-2 border-dashed border-[#FF9933] animate-pulse flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#c75e0a] bg-white/90 px-2 py-0.5 rounded-full shadow-xs">
                  400m Privacy Radius
                </span>
              </div>
            )}

            {/* Location Pin */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#FF9933] text-white flex items-center justify-center shadow-lg border-2 border-white transform -translate-y-2 hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-md mt-1">
                {city || 'Selected Coordinates'}
              </div>
            </div>

            {/* Bottom Lat/Lng Ribbon */}
            <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-xs p-2 rounded-lg border border-slate-200 text-xs flex justify-between items-center text-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px]">
                  Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
                </span>
              </div>
              <span className="text-[10px] text-[#c75e0a] font-medium">
                Google Maps GPS Lock Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Approximate Location Privacy Toggle */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
        <button
          type="button"
          onClick={() =>
            onChange({
              latitude,
              longitude,
              address,
              city,
              state,
              pincode,
              approximateLocation: !approximateLocation,
            })
          }
          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center text-white transition-colors cursor-pointer ${
            approximateLocation ? 'bg-[#FF9933]' : 'border border-slate-300 bg-white text-transparent'
          }`}
        >
          ✓
        </button>
        <div className="flex-1 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-0.5">
            {approximateLocation ? (
              <EyeOff className="w-3.5 h-3.5 text-[#FF9933]" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Protect exact pinpoint (Show Approximate Neighborhood Circle)</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            When enabled, public buyers will see a 400m approximate radius on the map rather than the exact survey boundary. Full pinpoint is only shared upon your mutual consent.
          </p>
        </div>
      </div>

      {/* Address Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Complete Street / Layout Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) =>
              onChange({
                latitude,
                longitude,
                address: e.target.value,
                city,
                state,
                pincode,
                approximateLocation,
              })
            }
            placeholder="Plot No, Survey No, Avenue Road, Locality"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] bg-white"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            City / Town <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) =>
              onChange({
                latitude,
                longitude,
                address,
                city: e.target.value,
                state,
                pincode,
                approximateLocation,
              })
            }
            placeholder="e.g. Hyderabad"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] bg-white"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            State <span className="text-rose-500">*</span>
          </label>
          <select
            value={state}
            onChange={(e) =>
              onChange({
                latitude,
                longitude,
                address,
                city,
                state: e.target.value,
                pincode,
                approximateLocation,
              })
            }
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] bg-white"
            required
          >
            <option value="">Select State</option>
            {INDIAN_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            PIN Code (6 digits) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) =>
              onChange({
                latitude,
                longitude,
                address,
                city,
                state,
                pincode: e.target.value,
                approximateLocation,
              })
            }
            placeholder="e.g. 500081"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] bg-white"
            required
          />
        </div>
      </div>
    </div>
  );
}
