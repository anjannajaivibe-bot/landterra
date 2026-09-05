'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Eye,
  EyeOff,
  ExternalLink,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { INDIAN_STATES } from '@/config/constants';

interface GoogleMapPickerProps {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  approximateLocation: boolean;
  placeName?: string;
  showAddressInputs?: boolean;
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
  placeName,
  showAddressInputs = false,
  onChange,
}: GoogleMapPickerProps) {
  const [mapType, setMapType] = useState<'satellite' | 'roadmap'>('satellite');
  const [zoom, setZoom] = useState<number>(16);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 1, 19));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 1, 12));

  // Reliable Google Maps Embed URL (satellite and roadmap views without API key restrictions)
  const embedMapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&t=${
    mapType === 'satellite' ? 'k' : 'm'
  }&z=${zoom}&output=embed`;

  const fullMapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  const displayTitle = placeName || address || city || 'Property Pinpoint';

  return (
    <div className="space-y-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
      {/* Top Header: View Toggle & Sync Status */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#FF9933]" />
          <span className="text-xs font-bold text-slate-900">
            {displayTitle}
          </span>
        </div>

        {/* Satellite vs Roadmap Toggle */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold shadow-xs">
          <button
            type="button"
            onClick={() => setMapType('satellite')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              mapType === 'satellite'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛰️ Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapType('roadmap')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              mapType === 'roadmap'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗺️ Roadmap
          </button>
        </div>
      </div>

      {/* Live Interactive Map Surface */}
      <div className="relative aspect-16/10 sm:aspect-16/9 w-full rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 shadow-md">
        {/* Real Google Maps Embed iframe */}
        <iframe
          title="Live Google Map Location"
          src={embedMapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full"
        />

        {/* Top-Right Map Controls (Zoom & External) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-md overflow-hidden flex flex-col">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              aria-label="Zoom In"
              className="p-2 hover:bg-slate-100 text-slate-700 transition-colors border-b border-slate-200/60 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out"
              aria-label="Zoom Out"
              className="p-2 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          <a
            href={fullMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Google Maps"
            className="p-2 bg-white/95 backdrop-blur-md hover:bg-white rounded-xl border border-slate-200/80 shadow-md text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Top-Left Pinpoint Identifier Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md text-xs flex items-center gap-1.5 text-slate-800 pointer-events-none z-10 max-w-[70%] truncate">
          <MapPin className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
          <span className="font-bold text-slate-900 truncate">
            {displayTitle}
          </span>
          <span className="text-[10px] text-slate-400 font-mono shrink-0">
            ({latitude.toFixed(4)}, {longitude.toFixed(4)})
          </span>
        </div>

        {/* Center Privacy Radius Visual Overlay (Only if Approximate is enabled) */}
        {approximateLocation && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="w-24 h-24 rounded-full bg-[#FF9933]/20 border-2 border-dashed border-[#FF9933] flex items-center justify-center shadow-lg animate-pulse">
              <span className="text-[10px] font-bold text-[#c75e0a] bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-md">
                50–100m Privacy Zone
              </span>
            </div>
          </div>
        )}

        {/* Bottom Lat/Lng Ribbon */}
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/80 shadow-md text-xs flex flex-wrap justify-between items-center gap-2 text-slate-700 z-10">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-slate-900">
              GPS: {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Google Satellite Synced
            </span>
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
            When enabled, public buyers will see a 50–100m approximate radius on the map rather than the exact survey boundary. Full pinpoint is only shared upon your mutual consent.
          </p>
        </div>
      </div>

      {/* Address Fields Grid (Only if showAddressInputs is true) */}
      {showAddressInputs && (
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
      )}
    </div>
  );
}
