'use client';

import React, { useState } from 'react';
import { Phone, Check, Copy, AlertCircle, X } from 'lucide-react';

interface CallSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerData: {
    sellerName: string;
    sellerPhone: string;
    sellerEmail?: string;
  } | null;
  propertyTitle?: string;
}

export function CallSellerModal({
  isOpen,
  onClose,
  sellerData,
  propertyTitle,
}: CallSellerModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !sellerData) return null;

  const handleCopy = () => {
    if (!sellerData.sellerPhone) return;
    navigator.clipboard.writeText(sellerData.sellerPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff1dc] text-[#c75e0a]">
            <Phone className="h-6 w-6 text-[#FF9933]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              Direct Landowner Contact
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Zero brokerage • Direct to owner
            </p>
          </div>
        </div>

        {propertyTitle && (
          <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Inquiring for:
            </div>
            <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
              {propertyTitle}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#fffbf5] border border-[#FF9933]/30">
            <div className="text-[11px] font-bold text-[#c75e0a]">
              Land Owner / Seller:
            </div>
            <div className="text-sm font-extrabold text-slate-900 mt-0.5">
              {sellerData.sellerName}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-[#FF9933]/20">
              <span className="font-mono text-base font-black text-slate-900 tracking-wide">
                {sellerData.sellerPhone}
              </span>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#FF9933]/40 text-[#c75e0a] hover:bg-[#fff1dc] text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#FF9933]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-2.5 pt-1">
            <a
              href={`tel:${sellerData.sellerPhone}`}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Call Now</span>
            </a>

            {sellerData.sellerEmail && (
              <a
                href={`mailto:${sellerData.sellerEmail}?subject=Inquiry regarding your land listing`}
                className="px-4 inline-flex items-center justify-center py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Email
              </a>
            )}
          </div>

          <div className="flex items-start gap-2 pt-2 text-[11px] text-slate-500 leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Your call inquiry was recorded for your security. Verify government land records (Pahani &amp; EC) before entering financial transactions.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
