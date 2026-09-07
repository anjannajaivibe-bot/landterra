'use client';

import React from 'react';
import { ShieldCheck, Flag } from 'lucide-react';
import { DueDiligenceChecklist } from '@/components/legal/DueDiligenceChecklist';

interface DueDiligenceCardProps {
  onOpenReportModal: () => void;
}

export function DueDiligenceCard({ onOpenReportModal }: DueDiligenceCardProps) {
  return (
    <div className="space-y-6">
      {/* Due Diligence Interactive Verification Checklist */}
      <DueDiligenceChecklist />

      {/* Legal Disclaimer & Fraud Reporting Notice */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

          <div>
            <h3 className="text-[11px] font-bold text-slate-700">Before you proceed</h3>

            <p className="mt-1 text-[10px] leading-5 text-slate-500">
              BhoomiMitra facilitates property discovery, advertising hosting, and direct
              communication between sellers and prospective buyers. BhoomiMitra does not provide
              title verification, legal opinions, or survey certification. A listing does not
              constitute a guarantee of title, ownership, legality, boundary accuracy, or
              dispute-free status. Conduct independent legal, title, registration, and physical due
              diligence with qualified advocates and revenue authorities before entering into any
              transaction.
            </p>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Notice fraudulent or misleading information?
              </span>
              <button
                type="button"
                onClick={onOpenReportModal}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:underline cursor-pointer"
              >
                <Flag className="h-3.5 w-3.5 text-rose-600" />
                <span>Report Listing to Moderation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
