'use client';

import React from 'react';
import { BadgeIndianRupee } from 'lucide-react';
import { SellFormState, SellFormActions } from '@/types/sell-form';

interface RentalSpecsProps {
  state: SellFormState;
  actions: SellFormActions;
}

export function RentalSpecs({ state, actions }: RentalSpecsProps) {
  const {
    landType,
    monthlyRent,
    securityDepositMonths,
    leaseLockInPeriod,
    maintenanceCharges,
    furnishingStatus,
  } = state;

  const {
    setMonthlyRent,
    setSecurityDepositMonths,
    setLeaseLockInPeriod,
    setMaintenanceCharges,
    setFurnishingStatus,
  } = actions;

  const isRentalType = [
    'RESIDENTIAL_RENTAL',
    'COMMERCIAL_LEASE',
    'COLIVING_PG',
    'VACATION_RENTAL_AIRBNB',
  ].includes(landType);

  if (!isRentalType) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 shadow-xs">
      <div className="flex items-center gap-2.5 pb-3 border-b border-amber-100">
        <div className="w-8 h-8 rounded-lg bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
          <BadgeIndianRupee className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            Rental, Lease &amp; Income Terms
          </h3>
          <p className="text-[11px] text-slate-500">
            Expected monthly rent, security deposit, lock-in period, and maintenance.
          </p>
        </div>
      </div>

      {/* Monthly Rent & Security Deposit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Monthly Rent / Lease Asking (₹ / Month) *
          </label>
          <input
            type="text"
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
            placeholder="e.g. 45,000 / month"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Security Deposit
          </label>
          <select
            value={securityDepositMonths}
            onChange={(e) => setSecurityDepositMonths(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
          >
            <option value="1 Month">1 Month Rent</option>
            <option value="2 Months">2 Months Rent</option>
            <option value="3 Months">3 Months Rent</option>
            <option value="6 Months">6 Months Rent</option>
            <option value="10 Months">10 Months Rent</option>
          </select>
        </div>
      </div>

      {/* Lock-in Period & Maintenance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Lease Agreement / Lock-in Period
          </label>
          <select
            value={leaseLockInPeriod}
            onChange={(e) => setLeaseLockInPeriod(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
          >
            <option value="11 Months">11 Months (Standard)</option>
            <option value="1 Year">1 Year</option>
            <option value="2 Years">2 Years</option>
            <option value="3 Years">3 Years</option>
            <option value="5 Years">5 Years (Commercial)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Maintenance Charges
          </label>
          <input
            type="text"
            value={maintenanceCharges}
            onChange={(e) => setMaintenanceCharges(e.target.value)}
            placeholder="e.g. Included in rent / ₹3,000 extra"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
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
    </div>
  );
}
