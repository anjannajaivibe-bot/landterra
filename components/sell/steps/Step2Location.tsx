'use client';

import React from 'react';
import { Loader2, Navigation, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { GoogleMapPicker } from '@/components/maps/GoogleMapPicker';
import { INDIAN_STATES } from '@/config/constants';
import { UseSellFormReturn } from '@/types/sell-form';

interface Step2LocationProps {
  form: UseSellFormReturn;
}

export function Step2Location({ form }: Step2LocationProps) {
  const { state, actions } = form;
  const {
    googleMapsShareLink,
    latitude,
    longitude,
    address,
    city,
    state: propertyState,
    pincode,
    approximateLocation,
    isResolvingMapLink,
    hasLocatedMap,
    resolvedPlaceName,
    mapLinkResolutionStatus,
  } = state;

  const {
    setGoogleMapsShareLink,
    setLatitude,
    setLongitude,
    setAddress,
    setCity,
    setState,
    setPincode,
    setApproximateLocation,
    handleResolveMapLink,
  } = actions;

  return (
    <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">
          Where is the property?
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Add the address first. A Google Maps link is optional, but helps place the property accurately.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Google Maps link
          </label>
          {isResolvingMapLink && (
            <span className="text-[11px] font-semibold text-[#c75e0a] flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Locating...
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              value={googleMapsShareLink}
              onChange={(event) => {
                const val = event.target.value;
                setGoogleMapsShareLink(val);
                if (val.includes('goo.gl/') || val.includes('/maps/') || val.includes('@')) {
                  handleResolveMapLink(val);
                }
              }}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData('text');
                if (pasted) {
                  setTimeout(() => handleResolveMapLink(pasted), 50);
                }
              }}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] bg-white"
            />
          </div>
          <button
            type="button"
            onClick={() => handleResolveMapLink()}
            disabled={isResolvingMapLink || !googleMapsShareLink.trim()}
            className="px-4 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
          >
            {isResolvingMapLink ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-[#FF9933]" />
            )}
            <span>Use link</span>
          </button>
        </div>

        {mapLinkResolutionStatus && (
          <div
            className={`mt-2.5 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 border ${
              mapLinkResolutionStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            {mapLinkResolutionStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{mapLinkResolutionStatus.message}</span>
          </div>
        )}

        <p className="text-[10px] text-slate-400 mt-1.5">
          Paste a Google Maps share link if you have one. We will use it to position the map and can fill location details automatically.
        </p>
      </div>

      {/* Map Display: shows cleanly below once link is entered and located */}
      {hasLocatedMap || googleMapsShareLink ? (
        <div className="rounded-xl overflow-hidden border border-slate-200 animate-in fade-in duration-200">
          <GoogleMapPicker
            latitude={latitude}
            longitude={longitude}
            address={address}
            city={city}
            state={propertyState}
            pincode={pincode}
            approximateLocation={approximateLocation}
            placeName={resolvedPlaceName}
            showAddressInputs={false}
            onChange={(data) => {
              setLatitude(data.latitude);
              setLongitude(data.longitude);
              if (data.address) setAddress(data.address);
              if (data.city) setCity(data.city);
              if (data.state) setState(data.state);
              if (data.pincode) setPincode(data.pincode);
              setApproximateLocation(data.approximateLocation);
            }}
          />
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100/70 text-[#c75e0a] flex items-center justify-center">
            <MapPin className="w-6 h-6 text-[#FF9933]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Add a map pin if useful
            </h3>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              You can continue with the address fields below, or paste a Google Maps link above to show the property on the map.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Address / site details *
          </label>
          <textarea
            rows={3}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Plot number, survey location, layout name"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              City *
            </label>
            <input
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="City"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                State *
              </label>
              <select
                value={propertyState}
                onChange={(event) => setState(event.target.value)}
                className="w-full px-3 py-3 rounded-lg border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
              >
                {INDIAN_STATES.map((item: any) => {
                  const value = item.value || item;
                  const label = item.label || item.name || item;
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pincode *
              </label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(event) =>
                  setPincode(event.target.value.replace(/\D/g, ''))
                }
                placeholder="500001"
                className="w-full px-3 py-3 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
              />
            </div>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer">
        <input
          type="checkbox"
          checked={approximateLocation}
          onChange={(event) =>
            setApproximateLocation(event.target.checked)
          }
          className="mt-0.5 w-4 h-4 accent-amber-700"
        />
        <span>
          <span className="block text-xs font-bold text-amber-900">
            Keep the exact public map pin approximate
          </span>
          <span className="block text-[10px] text-amber-800 mt-1 leading-relaxed">
            Useful when you want people to understand the area without exposing the exact pin publicly.
          </span>
        </span>
      </label>
    </div>
  );
}
