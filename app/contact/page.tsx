'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Mail,
  PhoneCall,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Scale,
  Clock,
  Building2,
  FileCheck2,
} from 'lucide-react';
import { SITE_CONFIG } from '@/config/constants';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone?.trim() || undefined,
          message: formData.message.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit your message. Please try again.');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-slate-950 text-white py-14 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 mb-3">
            <Scale className="w-4 h-4" />
            <span>Support, Compliance & Grievance Desk</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Contact Support & Grievance Officer
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-3 max-w-2xl leading-relaxed">
            Reach our title verification desk, submit listing inquiries, or file statutory consumer grievances directly with our designated compliance team.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-10">
        {/* Main 2-Column Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Details Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Customer Support Desk</h2>
                <p className="text-xs text-slate-500 mt-1">Available for buyer questions, listing help, and billing assistance</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">General & Billing Support</span>
                    <span className="font-mono text-emerald-800">{SITE_CONFIG.supportEmail}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 shrink-0">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Helpline & Verification Desk</span>
                    <span className="text-slate-800 font-semibold">{SITE_CONFIG.contactPhone}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">Monday to Saturday • 9:00 AM – 7:00 PM IST</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Compliance Office</span>
                    <span className="text-slate-600">BhoomiMitra Marketplace Technologies, Financial District, Nanakramguda, Hyderabad, Telangana 500032, India</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>Response Turnaround</span>
              </div>
              <p>Inquiries submitted via web form are acknowledged within 4 hours and typically resolved within 1 business day.</p>
            </div>
          </div>

          {/* Quick Message Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Send an Inquiry</h2>
              <p className="text-xs text-slate-500 mt-1">Submit your verification questions or platform feedback</p>
            </div>

            {submitted ? (
              <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span>Message Sent Successfully</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Thank you for reaching out, {formData.name || 'valued user'}. Our dedicated legal and compliance team has received your query and will reply to {formData.email || 'your email'} within 1 business day.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setErrorMessage(null);
                    setFormData({ name: '', email: '', phone: '', message: '' });
                  }}
                  className="mt-2 text-xs font-bold text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full legal name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    disabled={loading}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Message / Inquiry Details *</label>
                  <textarea
                    rows={4}
                    required
                    disabled={loading}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your query, property ID, or verification question..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <span>Send Message</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Statutory Grievance Officer Card (IT Act 2000 & E-Commerce Rules Compliance) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-800">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Statutory Grievance Redressal Officer
              </h2>
              <p className="text-xs text-slate-500">
                Designated in accordance with Information Technology Act, 2000 and Consumer Protection Rules
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            In accordance with the <strong>Information Technology Act, 2000</strong>, the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, the contact details of the designated Grievance Officer are published below:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Designation & Identity</p>
              <p className="text-slate-900 font-extrabold text-sm">Grievance & Redressal Officer</p>
              <p className="text-slate-600">Legal & Regulatory Compliance Department</p>
              <p className="text-slate-600">BhoomiMitra Marketplace Technologies</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Contact Coordinates</p>
              <p className="text-slate-700"><strong>Grievance Email:</strong> <span className="font-mono text-emerald-800 font-bold">grievance@bhoomimitra.com</span></p>
              <p className="text-slate-700"><strong>General Privacy:</strong> <span className="font-mono text-emerald-800">privacy@bhoomimitra.com</span></p>
              <p className="text-slate-600"><strong>Jurisdiction:</strong> Hyderabad, Telangana, India</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-950 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-blue-800" />
              <span>Grievance Redressal Timeline:</span>
            </p>
            <p className="text-blue-900/90 leading-relaxed">
              Upon receipt of a formal complaint regarding listing infringement, copyright, impersonation, or privacy, the Grievance Officer will issue an acknowledgment ticket within <strong>24 hours</strong> and resolve the grievance within <strong>15 days</strong> of receipt.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
