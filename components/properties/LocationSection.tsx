'use client';

import React from 'react';
import { MapPin, ExternalLink, Info } from 'lucide-react';
import { IProperty } from '@/types/property';

interface LocationSectionProps {
  property: IProperty;
}

function LocationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-[10px] font-semibold text-slate-400">{label}</span>
      <span className="max-w-[65%] text-right text-xs font-bold text-slate-700">{value}</span>
    </div>
  );
}

export function LocationSection({ property }: LocationSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1dc] text-[#c75e0a]">
          <MapPin className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-black text-slate-950">Location</h2>
      </div>

      <div className="mt-5 space-y-4">
        <LocationRow label="City" value={property.location?.city || 'Not specified'} />
        <LocationRow label="District" value={property.location?.district || 'Not specified'} />
        <LocationRow label="State" value={property.location?.state || 'Not specified'} />
        <LocationRow label="Pincode" value={property.location?.pincode || 'Not specified'} />

        {property.location?.address && (
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</p>
            <p className="mt-1 text-xs leading-5 text-slate-700">{property.location.address}</p>
          </div>
        )}

        {property.approximateLocation && (
          <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-4">
              Approximate location enabled by seller to protect exact plot privacy prior to direct contact.
            </p>
          </div>
        )}

        {property.googleMapsShareLink && (
          <a
            href={property.googleMapsShareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition-colors hover:border-[#FF9933] hover:bg-[#fff9f0] hover:text-[#c75e0a]"
          >
            <MapPin className="h-4 w-4" />
            <span>Open in Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
