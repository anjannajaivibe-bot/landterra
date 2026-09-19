'use client';

import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Camera,
  FileText,
  PencilLine,
} from 'lucide-react';
import { LAND_TYPES } from '@/config/constants';
import { UseSellFormReturn } from '@/types/sell-form';

interface Step7ReviewPaymentProps {
  form: UseSellFormReturn;
  existingPropertyId?: string | null;
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
    transactionType,
    title,
    description,
    city,
    state: propertyState,
    pincode,
    landType,
    bhk,
    facing,
    monthlyRent,
    selectedAmenities,
    termsAccepted,
    authoritativeFees,
    areaConversions,
    images,
    video,
    documents,
  } = state;

  const {
    setTermsAccepted,
    setCurrentStep,
    syncStepToUrl,
  } = actions;

  const { landAreaYards, totalPrice } = authoritativeFees;

  const typeLabel =
    LAND_TYPES.find(
      (type: any) => (type.value || type.id) === landType,
    )?.label || landType.replace(/_/g, ' ');

  const transactionLabel =
    transactionType === 'SALE'
      ? 'For sale'
      : transactionType === 'RENT'
        ? 'For rent'
        : 'For lease';

  const monthlyAmount =
    Number(String(monthlyRent).replace(/,/g, '')) || 0;

  const editStep = (step: number) => {
    setCurrentStep(step);
    syncStepToUrl(step);
  };

  return (
    <div className="p-5 sm:p-7 space-y-7 animate-in fade-in duration-150">
      <div>
        <p className="text-[11px] font-bold text-[#c75e0a]">
          Step 5 of 5
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-slate-950">
          Review before you submit
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Check the essentials below. Your listing will be reviewed before it becomes publicly visible.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              Listing summary
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              What property seekers will understand at a glance
            </p>
          </div>
          <button
            type="button"
            onClick={() => editStep(1)}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#a84f08] hover:text-[#7a3705]"
          >
            <PencilLine className="w-3.5 h-3.5" />
            Edit basics
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-1 rounded-md bg-[#fff8ef] text-[#8f4308] text-[10px] font-bold border border-[#FF9933]/25">
                {transactionLabel}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {typeLabel}
              </span>
            </div>
            <h3 className="mt-2 text-base font-extrabold text-slate-950">
              {title || 'Untitled property'}
            </h3>
            {description && (
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-3">
                {description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Area
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">
                {formatArea(landAreaYards, 2)} sq. yd
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {formatArea(areaConversions.sqFeet, 0)} sq. ft
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                {transactionType === 'SALE' ? 'Asking price' : 'Monthly amount'}
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">
                ₹{Number(
                  transactionType === 'SALE'
                    ? totalPrice
                    : monthlyAmount,
                ).toLocaleString('en-IN')}
                {transactionType !== 'SALE' && (
                  <span className="text-[10px] font-semibold text-slate-500"> / month</span>
                )}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Configuration
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">
                {bhk && bhk !== 'NOT_SPECIFIED'
                  ? bhk
                  : facing && facing !== 'NOT_SPECIFIED'
                    ? `${facing} facing`
                    : 'Not specified'}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Media
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">
                {images.length} {images.length === 1 ? 'photo' : 'photos'}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {video ? 'Video included' : 'No video'}
              </p>
            </div>
          </div>

          {selectedAmenities.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Key features
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedAmenities.slice(0, 8).map((amenity) => (
                  <span
                    key={amenity}
                    className="px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-700"
                  >
                    {amenity}
                  </span>
                ))}
                {selectedAmenities.length > 8 && (
                  <span className="px-2 py-1 text-[10px] font-semibold text-slate-500">
                    +{selectedAmenities.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => editStep(2)}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300 transition-colors"
        >
          <MapPin className="w-4 h-4 text-[#c75e0a]" />
          <p className="mt-2 text-xs font-extrabold text-slate-900">Location</p>
          <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">
            {[city, propertyState, pincode].filter(Boolean).join(', ') || 'Location details not complete'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => editStep(4)}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300 transition-colors"
        >
          <Camera className="w-4 h-4 text-[#c75e0a]" />
          <p className="mt-2 text-xs font-extrabold text-slate-900">Media</p>
          <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">
            {images.length} photos{video ? ' + video walkthrough' : ''}
          </p>
        </button>

        <button
          type="button"
          onClick={() => editStep(4)}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300 transition-colors"
        >
          <FileText className="w-4 h-4 text-[#c75e0a]" />
          <p className="mt-2 text-xs font-extrabold text-slate-900">Supporting documents</p>
          <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">
            {documents.length > 0
              ? `${documents.length} document${documents.length === 1 ? '' : 's'} attached`
              : 'Optional. You can add documents later.'}
          </p>
        </button>
      </div>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-white border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-emerald-950">
              Ready for platform review
            </h3>
            <p className="mt-1 text-[11px] text-emerald-800 leading-relaxed">
              Submitting does not make the property instantly public. BhoomiMitra will review the listing information and supporting material first. You can manage the listing from your seller dashboard.
            </p>
            {existingPropertyId && (
              <p className="mt-2 text-[10px] font-semibold text-emerald-800">
                Your saved listing will be updated and re-submitted for review.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#c75e0a]" />
          <h3 className="text-sm font-extrabold text-slate-950">
            Seller declaration
          </h3>
        </div>

        <div className="text-[11px] text-slate-600 leading-relaxed space-y-2">
          <p>
            I confirm that I am authorized to advertise this property and that the details I have provided are accurate to the best of my knowledge.
          </p>
          <p>
            I understand that BhoomiMitra is a property marketplace. Listing review does not certify ownership, title, legality, valuation or transaction safety. Buyers and tenants should complete their own due diligence.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer pt-3 border-t border-slate-200">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="w-4 h-4 mt-0.5 accent-[#FF9933]"
          />
          <span className="text-xs font-semibold text-slate-900 leading-snug">
            I accept the Seller Declaration, Listing Rules and Terms of Service.
          </span>
        </label>
      </section>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3.5">
        <p className="text-[11px] text-blue-900 leading-relaxed">
          Not ready to submit? Use <strong>Save draft</strong>. Your work can be continued later without publishing the listing.
        </p>
      </div>
    </div>
  );
}
