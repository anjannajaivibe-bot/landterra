'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { UseSellFormReturn } from '@/types/sell-form';

interface Step4RecordsProps {
  form: UseSellFormReturn;
}

export function Step4Records({ form }: Step4RecordsProps) {
  const { state, actions } = form;
  const { governmentRegistrationId } = state;
  const { setGovernmentRegistrationId } = actions;

  return (
    <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">
          Property records
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Add an official property reference if you have one. This step is optional.
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Survey / registration / khata reference
        </label>
        <input
          type="text"
          value={governmentRegistrationId}
          onChange={(event) =>
            setGovernmentRegistrationId(event.target.value)
          }
          placeholder="Example: Survey No. 123/4A"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
        />
        <p className="text-[10px] text-slate-400 mt-1">
          Enter the survey number, registration number, khata number, or other official identifier.
        </p>
      </div>

      <div className="rounded-2xl bg-[#fff9f0] border border-[#FF9933]/30 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-[#FF9933] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-extrabold text-[#7a3705]">
              Optional, but useful for review
            </h3>
            <p className="text-xs text-[#9c4c0b] mt-1 leading-relaxed">
              A survey, registration, khata or similar reference can help our review team understand the listing. Adding a reference does not mean BhoomiMitra has verified ownership or title.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
