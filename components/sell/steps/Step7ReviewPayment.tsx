'use client';

import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { LAND_TYPES } from '@/config/constants';
import { UseSellFormReturn } from '@/types/sell-form';

interface Step7ReviewPaymentProps {
  form: UseSellFormReturn;
  existingPropertyId?: string | null;
  existingPaymentStatus?: string | null;
  listingDurationDays?: number;
  listingFeeAmount?: number;
}

function formatArea(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function Step7ReviewPayment({
  form,
  existingPropertyId = null,
}: Step7ReviewPaymentProps) {
  const { state, actions } = form;
  const {
    title,
    city,
    state: propertyState,
    landType,
    bhk,
    facing,
    vastuCompliant,
    totalRooms,
    monthlyRent,
    villaPrivateFeatures,
    additionalRooms,
    selectedAmenities,
    termsAccepted,
    authoritativeFees,
    areaConversions,
  } = state;

  const { setTermsAccepted } = actions;
  const { landAreaYards, totalPrice } = authoritativeFees;

  return (
    <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">
          Review &amp; Publish
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review your listing details before submitting the property for platform review.
        </p>
      </div>

      {/* Property Summary */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-extrabold text-slate-900">
            Listing Summary
          </h3>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Property Title
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {title || 'Untitled property'}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Location
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {city || '—'}, {propertyState || '—'}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Land Area
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {formatArea(landAreaYards, 2)} sq. yards
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              {formatArea(areaConversions.acres, 4)} acres •{' '}
              {formatArea(areaConversions.guntas, 2)} guntas
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Property Type &amp; Configuration
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {LAND_TYPES.find((t: any) => (t.value || t.id) === landType)?.label || landType}
              {[
                'FLAT',
                'INDEPENDENT_HOUSE',
                'VILLA',
                'HOUSE_VILLA',
                'TOWNHOUSE',
                'DUPLEX',
                'PENTHOUSE',
                'SERVICE_APARTMENT',
                'RESIDENTIAL_RENTAL',
                'COLIVING_PG',
                'VACATION_RENTAL_AIRBNB',
              ].includes(landType) && bhk && bhk !== 'NOT_SPECIFIED' ? ` • ${bhk}` : ''}
              {facing && facing !== 'NOT_SPECIFIED' ? ` • ${facing} Facing` : ''}
              {vastuCompliant && ['VILLA', 'INDEPENDENT_HOUSE', 'HOUSE_VILLA', 'TOWNHOUSE', 'DUPLEX'].includes(landType) ? ' • 100% Vastu' : ''}
              {['RESORT', 'HOTEL', 'SERVICE_APARTMENT', 'GUEST_HOUSE'].includes(landType) && totalRooms ? ` • ${totalRooms}` : ''}
              {['RESIDENTIAL_RENTAL', 'COMMERCIAL_LEASE', 'COLIVING_PG', 'VACATION_RENTAL_AIRBNB'].includes(landType) && monthlyRent ? ` • ₹${monthlyRent}/mo` : ''}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Total Valuation
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              ₹{Number(totalPrice || 0).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Private Villa Features & Rooms if any */}
          {(villaPrivateFeatures.length > 0 || additionalRooms.length > 0) &&
            ['VILLA', 'INDEPENDENT_HOUSE', 'HOUSE_VILLA', 'TOWNHOUSE', 'DUPLEX'].includes(landType) && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                  Private Grounds &amp; Rooms ({villaPrivateFeatures.length + additionalRooms.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {villaPrivateFeatures.map((f) => (
                    <span
                      key={f}
                      className="px-2 py-0.5 rounded-md bg-[#fff1dc] border border-[#FF9933]/30 text-[#7a3705] text-[10px] font-bold"
                    >
                      ★ {f}
                    </span>
                  ))}
                  {additionalRooms.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-semibold"
                    >
                      + {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {selectedAmenities.length > 0 && (
            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                Key Amenities &amp; Features ({selectedAmenities.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedAmenities.map((a) => (
                  <span
                    key={a}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold"
                  >
                    ✓ {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Platform Review Status */}
      <div className="rounded-2xl border border-[#FF9933]/30 bg-[#fff9f0] p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-950">
              {existingPropertyId
                ? 'Ready to Submit Your Changes'
                : 'Ready for Platform Review'}
            </h3>
            <p className="text-[11px] text-[#7a3705] mt-1 leading-relaxed">
              Your listing will be submitted for review. Once approved, it can be published on the BhoomiMitra marketplace.
            </p>
          </div>
        </div>
      </div>
      {/* Seller Declaration & Marketplace Undertaking Card */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#FF9933]" />
          <h3 className="text-sm font-extrabold text-slate-950">
            Seller Declaration &amp; Publishing Undertaking
          </h3>
        </div>

        <ul className="space-y-2 text-[11px] text-slate-600 leading-relaxed list-disc pl-4">
          <li>
            <strong>Authorization:</strong> I represent that I am the owner of this property or am otherwise lawfully authorized to advertise this listing.
          </li>
          <li>
            <strong>Accuracy:</strong> The land extent, pricing, boundaries, and descriptions submitted are accurate and my sole responsibility.
          </li>
          <li>
            <strong>Lawful Content:</strong> I undertake not to upload unlawful, fraudulent, misleading, or infringing content, or prohibited/disputed land parcels.
          </li>
          <li>
            <strong>Marketplace Role:</strong> I understand that BhoomiMitra operates as an online classifieds marketplace and does not certify ownership, inspect titles, or guarantee properties.
          </li>
          <li>
            <strong>Buyer Due Diligence:</strong> I acknowledge that prospective buyers must independently inspect revenue records, title deeds, and physical boundaries prior to transactions.
          </li>
          <li>
            <strong>Statutory Compliance:</strong> I agree to comply with applicable laws, terms of service, and platform listing rules.
          </li>
        </ul>

        <label className="flex items-start gap-3 cursor-pointer pt-3 border-t border-slate-200">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) =>
              setTermsAccepted(event.target.checked)
            }
            className="w-4 h-4 mt-0.5 accent-[#FF9933]"
          />
          <span className="text-xs font-semibold text-slate-900 leading-snug">
            I have read, understood, and accept the above Seller Declaration, Marketplace Listing Rules, and Terms of Service.
          </span>
        </label>
      </div>

      {/* Draft Preservation Notice */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-950">
              {existingPropertyId ? 'Draft Saved in Your Account' : 'Save Draft & Resume Anytime'}
            </p>
            <p className="text-[10px] text-blue-900/80 mt-1 leading-relaxed">
              Use the <strong>Save Draft</strong> button below to save all your entered details, photographs, and video directly to your account. Your work will never be lost even if you refresh or leave the page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
