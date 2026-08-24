'use client';

import React from 'react';
import { MapPin, Navigation, EyeOff, ShieldCheck } from 'lucide-react';

interface PropertyDetailMapProps {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  address: string;
  approximateLocation?: boolean;
}

export function PropertyDetailMap({
  latitude,
  longitude,
  city,
  state,
  address,
  approximateLocation = false,
}: PropertyDetailMapProps) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>Property Location & Map</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {address} • {city}, {state}
          </p>
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors border border-slate-200"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-700" />
          <span>Get Directions</span>
        </a>
      </div>

      {/* Map Surface */}
      <div className="relative aspect-16/8 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
        {/* Background Grid Representation */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Approximate Privacy Ring or Exact Pin */}
        {approximateLocation ? (
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-40 h-40 rounded-full bg-emerald-500/15 border-2 border-dashed border-emerald-600 animate-pulse flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md">
                <EyeOff className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-md shadow-md mt-2 flex items-center gap-1.5">
              <span>Approximate Neighborhood Center</span>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-lg border-2 border-white transform -translate-y-2">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-md shadow-md mt-1">
              {address}
            </div>
          </div>
        )}

        {/* Floating Tag */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200 shadow-xs text-xs flex items-center gap-1.5 text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium">
            {approximateLocation ? 'Privacy Protected Location' : 'Exact Verified Coordinates'}
          </span>
        </div>

        {/* Coordinates Display */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-mono text-slate-600">
          {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
        </div>
      </div>

      {approximateLocation && (
        <div className="bg-amber-50/60 border-t border-amber-100 p-3 text-xs text-amber-800 flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            The seller has opted for approximate location privacy. The circle outlines the immediate neighborhood area.
          </span>
        </div>
      )}
    </div>
  );
}
