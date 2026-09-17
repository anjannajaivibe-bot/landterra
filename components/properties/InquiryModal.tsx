'use client';

import React, { useState } from 'react';
import { IProperty } from '@/types/property';
import { Mail, Phone, X, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';

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
  const modalRef = useModalAccessibility({ isOpen, onClose });
  const [message, setMessage] = useState('');
  const [phoneShared, setPhoneShared] = useState(false);
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState(buyerUser?.email || '');
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

    if (message.trim().length < 10) {
      setError('Message must be at least 10 characters.');
      return;
    }

    let cleanPhone = buyerPhone.trim().replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (!cleanPhone) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }

    const cleanEmail = buyerEmail.trim();
    if (!cleanEmail) {
      setError('Please enter your contact email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
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
          phoneShared: true,
          buyerPhone: cleanPhone,
          buyerEmail: cleanEmail,
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 outline-none"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 id="inquiry-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
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

              {/* 1. Contact Information Section (First) */}
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#FF9933]" />
                    <span>Your Contact Information</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    The landowner will use these details to contact you directly.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="inquiry-email-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        id="inquiry-email-input"
                        name="email"
                        autoComplete="email"
                        required
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Status &amp; reply updates
                    </p>
                  </div>

                  <div>
                    <label htmlFor="inquiry-phone-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        id="inquiry-phone-input"
                        name="phone"
                        autoComplete="tel"
                        required
                        maxLength={10}
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit mobile"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Landowner calls / WhatsApp
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Message Section */}
              <div>
                <label htmlFor="inquiry-message-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Message to the Landowner <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="inquiry-message-input"
                  name="message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Inquire about price negotiation, survey boundary inspection, or plot visit times..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]"
                  required
                />
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
