'use client';

import React, { useState } from 'react';
import { IProperty } from '@/types/property';
import { Mail, Phone, X, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface InquiryModalProps {
  property: IProperty;
  isOpen: boolean;
  onClose: () => void;
  buyerUser?: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
}

export function InquiryModal({
  property,
  isOpen,
  onClose,
  buyerUser,
}: InquiryModalProps) {
  const [message, setMessage] = useState('');
  const [phoneShared, setPhoneShared] = useState(false);
  const [buyerPhone, setBuyerPhone] = useState(buyerUser?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter a message before sending.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property._id,
          message: message.trim(),
          phoneShared,
          buyerPhone: phoneShared ? buyerPhone : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry');

      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending inquiry';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#FF9933]" />
              <span>Contact Landowner</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ref: {property.title.substring(0, 45)}...
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Inquiry Dispatched</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto mb-6 leading-relaxed">
                Your message and inquiry ticket have been securely forwarded to the landowner. You can track communication in your Buyer Dashboard.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              {/* Privacy Notice */}
              <div className="p-3 rounded-lg bg-[#fff9f0] border border-[#FF9933]/30 flex items-start gap-2.5 text-xs text-[#7a3705]">
                <ShieldCheck className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Anti-Scraping Shield:</strong> Landowner contacts are protected. Inquiries are routed through BhoomiMitra&apos;s direct messaging gateway.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Message to the Landowner <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Inquire about price negotiation, survey boundary inspection, or plot visit times..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]"
                  required
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={phoneShared}
                      onChange={(e) => setPhoneShared(e.target.checked)}
                      className="rounded accent-[#FF9933] focus:ring-[#FF9933]"
                    />
                    <span>Share direct phone number for quicker landowner callback</span>
                  </label>
                </div>

                {phoneShared && (
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      maxLength={10}
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="10-digit mobile number (e.g. 9812345678)"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#FF9933] text-white text-xs font-semibold hover:bg-[#f07d12] transition-colors shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Inquiry'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
