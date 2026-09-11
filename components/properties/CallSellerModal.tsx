'use client';

import React, { useState } from 'react';
import {
  Phone,
  Check,
  Copy,
  AlertCircle,
  X,
  ShieldCheck,
  Loader2,
  MessageSquare,
  Mail,
  Sparkles,
} from 'lucide-react';
import { CloudflareTurnstile } from '@/components/security/CloudflareTurnstile';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';

interface CallSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerData: {
    sellerName: string;
    sellerPhone: string;
    sellerEmail?: string;
  } | null;
  propertyTitle?: string;
  propertyId?: string;
  callLoading?: boolean;
  callError?: string;
  onVerify?: (token: string) => void;
  onRetry?: () => void;
  onOpenInquiry?: () => void;
  onTrackWhatsApp?: () => void;
  userEmail?: string;
}

export function CallSellerModal({
  isOpen,
  onClose,
  sellerData,
  propertyTitle,
  propertyId,
  callLoading,
  callError,
  onVerify,
  onRetry,
  onOpenInquiry,
  onTrackWhatsApp,
  userEmail,
}: CallSellerModalProps) {
  const modalRef = useModalAccessibility({ isOpen, onClose });
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!sellerData?.sellerPhone) return;
    navigator.clipboard.writeText(sellerData.sellerPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-seller-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 outline-none"
      >
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
            <h3 id="call-seller-modal-title" className="text-base font-extrabold text-slate-900 leading-tight">
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

        {callError ? (
          <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs text-rose-800 space-y-3">
            <p className="font-bold">Unable to retrieve contact</p>
            <p>{callError}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="w-full rounded-lg bg-rose-600 px-3 py-2 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        ) : sellerData ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#fffbf5] border border-[#FF9933]/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Seller Name
                  </p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {sellerData.sellerName}
                  </p>
                </div>

                <div className="inline-flex items-center gap-1 rounded-full bg-[#fff1dc] px-2.5 py-1 text-[10px] font-bold text-[#c75e0a] border border-[#FF9933]/30">
                  <Sparkles className="h-3.5 w-3.5 text-[#FF9933]" />
                  Direct Seller
                </div>
              </div>

              <div className="border-t border-slate-200/60 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Phone Number
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-base font-black text-slate-900 tracking-wide">
                    {sellerData.sellerPhone}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#FF9933]/40 text-[#c75e0a] hover:bg-[#fff1dc] text-xs font-bold shadow-2xs transition-colors cursor-pointer"
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
            </div>

            <div className="space-y-2 pt-1">
              {(() => {
                const digits = (sellerData.sellerPhone || '').replace(/\D/g, '');
                const phone10 = digits.slice(-10);
                const cleanPhone = phone10.length === 10 ? `91${phone10}` : digits;
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bhoomimitra.com';
                const listingLink = propertyId ? `${baseUrl}/properties/${propertyId}` : '';
                const prefilledText = `Hi ${sellerData.sellerName || 'Landowner'}, I saw your listing "${propertyTitle || 'Property'}" on BhoomiMitra. I am interested and would like to get more details / site pin.${listingLink ? `\n\nListing: ${listingLink}` : ''}`;
                const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(prefilledText)}` : '#';

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href={`tel:${sellerData.sellerPhone}`}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] px-4 py-3.5 text-xs font-black text-white shadow-sm transition-all cursor-pointer"
                    >
                      <Phone className="h-4 w-4" />
                      <span>Call Now</span>
                    </a>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onTrackWhatsApp?.()}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] px-4 py-3.5 text-xs font-black text-white shadow-sm transition-all cursor-pointer"
                    >
                      <MessageSquare className="h-4 w-4 fill-current" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>
                );
              })()}

              {onOpenInquiry && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenInquiry();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Or Send Written Message</span>
                </button>
              )}
            </div>

            {userEmail && (
              <div className="rounded-xl bg-[#fff9f0] border border-[#FF9933]/25 p-3 text-[11px] text-[#7a3705] flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[#FF9933] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Direct Connection:</strong> Logged with your verified account (<code className="font-semibold text-[#c75e0a]">{userEmail}</code>) for safe marketplace communications.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-1">
            <div className="rounded-2xl bg-[#fffbf5] border border-[#FF9933]/30 p-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6 text-[#FF9933]" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Security Verification
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Please complete this quick security verification to view landowner contact details.
              </p>
            </div>

            {callLoading ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-2.5">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF9933]" />
                <p className="text-xs font-bold text-slate-700">
                  Retrieving landowner contact...
                </p>
              </div>
            ) : onVerify ? (
              <div className="flex justify-center py-2">
                <CloudflareTurnstile
                  action="call_seller"
                  onSuccess={onVerify}
                  onError={() => {}}
                  onExpire={() => {}}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
