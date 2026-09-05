'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, EyeOff, ShieldCheck, Layers, ExternalLink } from 'lucide-react';

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
  const [mapType, setMapType] = useState<'satellite' | 'roadmap'>('satellite');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const fullMapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  // Reliable Google Maps Embed URL (satellite and roadmap views without API key restrictions)
  const embedMapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&t=${mapType === 'satellite' ? 'k' : 'm'}&z=16&output=embed`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FF9933]" />
            <span>Geographic Location &amp; Satellite Map</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {address} • {city}, {state}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Map Type Switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold shadow-xs">
            <button
              type="button"
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                mapType === 'satellite'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapType('roadmap')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                mapType === 'roadmap'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roadmap
            </button>
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fff1dc] text-[#c75e0a] text-xs font-bold hover:bg-[#ffe5c2] transition-colors border border-[#FF9933]/30"
          >
            <Navigation className="w-3.5 h-3.5 text-[#FF9933]" />
            <span>Directions</span>
          </a>
        </div>
      </div>

      {/* Map Surface */}
      <div className="relative aspect-16/9 sm:aspect-16/8 w-full bg-slate-900 overflow-hidden">
        {/* Interactive Google Map iframe */}
        <iframe
          title="Property Location Map"
          src={embedMapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full"
        />

        {/* Floating Privacy or GPS Pin Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-md text-xs flex items-center gap-1.5 text-slate-800 pointer-events-none">
          {approximateLocation ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-semibold text-amber-950">Approximate Neighborhood Area</span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5 text-[#FF9933]" />
              <span className="font-semibold text-slate-900">GPS Site Coordinates</span>
            </>
          )}
        </div>

        {/* Open in Google Maps overlay */}
        <a
          href={fullMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md hover:bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-md text-[11px] font-mono text-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <span>{latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>

      {approximateLocation && (
        <div className="bg-amber-50/70 border-t border-amber-200/60 p-3 text-xs text-amber-900 flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            The seller has enabled approximate location privacy. The map shows the immediate locality area.
          </span>
        </div>
      )}
    </div>
  );
}
