'use client';

import React from 'react';
import { SellFormState, SellFormActions } from '@/types/sell-form';

interface RentalSpecsProps {
  state: SellFormState;
  actions: SellFormActions;
}

export function RentalSpecs({ state, actions }: RentalSpecsProps) {
  const {
    transactionType,
    securityDepositMonths,
    leaseLockInPeriod,
    maintenanceCharges,
    furnishingStatus,
  } = state;

  const {
    setSecurityDepositMonths,
    setLeaseLockInPeriod,
    setMaintenanceCharges,
    setFurnishingStatus,
  } = actions;

  const isRentalOrLease =
    transactionType === 'RENT' ||
    transactionType === 'LEASE';

  if (!isRentalOrLease) {
    return null;
  }

  return (
    <section className="border-t border-slate-200 pt-6 space-y-5 animate-in fade-in duration-150">
      <div>
        <h3 className="text-sm font-extrabold text-slate-900">
          Rent / lease terms
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Add only what applies. These details help people decide before contacting you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Security deposit
          </label>
          <select
            value={securityDepositMonths}
            onChange={(event) => setSecurityDepositMonths(event.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          >
            <option value="1 Month">1 month rent</option>
            <option value="2 Months">2 months rent</option>
            <option value="3 Months">3 months rent</option>
            <option value="6 Months">6 months rent</option>
            <option value="10 Months">10 months rent</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Agreement / lock-in period
          </label>
          <select
            value={leaseLockInPeriod}
            onChange={(event) => setLeaseLockInPeriod(event.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          >
            <option value="11 Months">11 months</option>
            <option value="1 Year">1 year</option>
            <option value="2 Years">2 years</option>
            <option value="3 Years">3 years</option>
            <option value="5 Years">5 years</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Maintenance charges
          </label>
          <input
            type="text"
            value={maintenanceCharges}
            onChange={(event) => setMaintenanceCharges(event.target.value)}
            placeholder="Included / ₹3,000 extra"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Furnishing
          </label>
          <select
            value={furnishingStatus}
            onChange={(event) => setFurnishingStatus(event.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          >
            <option value="UNFURNISHED">Unfurnished</option>
            <option value="SEMI_FURNISHED">Semi-furnished</option>
            <option value="FULLY_FURNISHED">Fully furnished</option>
          </select>
        </div>
      </div>
    </section>
  );
}
