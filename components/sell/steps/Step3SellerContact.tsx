'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { SellerType } from '@/types/user';
import { UseSellFormReturn } from '@/types/sell-form';

interface Step3SellerContactProps {
  form: UseSellFormReturn;
}

export function Step3SellerContact({ form }: Step3SellerContactProps) {
  const { state, actions } = form;
  const {
    sellerName,
    sellerEmail,
    sellerPhone,
    sellerType,
    sellerAddress,
    currentUser,
  } = state;

  const {
    setSellerName,
    setSellerEmail,
    setSellerPhone,
    setSellerType,
    setSellerAddress,
  } = actions;

  return (
    <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">
          Seller contact
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Confirm how interested buyers or tenants can reach you. Verified account details are reused where available.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Full Name *
          </label>
          <input
            type="text"
            value={sellerName}
            onChange={(event) => setSellerName(event.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Email *
          </label>
          <input
            type="email"
            value={sellerEmail}
            onChange={(event) => setSellerEmail(event.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Mobile Number *
          </label>
          <input
            type="tel"
            maxLength={10}
            value={sellerPhone}
            readOnly={Boolean(currentUser?.isPhoneVerified)}
            onChange={(event) =>
              setSellerPhone(event.target.value.replace(/\D/g, ''))
            }
            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm bg-slate-50 font-semibold text-slate-800"
          />
          {currentUser?.isPhoneVerified && (
            <p className="flex items-center gap-1 text-[10px] text-[#FF9933] font-semibold mt-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Phone verified
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Seller Type *
          </label>
          <select
            value={sellerType}
            onChange={(event) =>
              setSellerType(event.target.value as SellerType)
            }
            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
          >
            <option value="INDIVIDUAL">Individual Seller</option>
            <option value="COMPANY">Company / Builder</option>
            <option value="AGENT">Authorized Agent</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Correspondence address
        </label>
        <textarea
          rows={3}
          value={sellerAddress}
          onChange={(event) => setSellerAddress(event.target.value)}
          placeholder="Optional correspondence or office address"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
        />
      </div>
    </div>
  );
}
