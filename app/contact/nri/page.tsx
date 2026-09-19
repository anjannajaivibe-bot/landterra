'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Globe,
  ShieldCheck,
  FileText,
  Building2,
  PhoneCall,
  Mail,
  Scale,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  MessageSquare,
  Clock,
  ExternalLink,
} from 'lucide-react';

function NriContactContent() {
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin') || '';

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: origin || '',
    serviceInterest: 'Ancestral Title Verification & Due Diligence',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const fullMessage = [
        `Country of Residence: ${formData.country || 'Not specified'}`,
        `Area of Assistance: ${formData.serviceInterest}`,
        `Client Inquiry Details:`,
        formData.message.trim(),
      ].join('\n\n');

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone?.trim() || undefined,
          subject: `[NRI Desk - ${formData.country || 'Global'}] ${formData.serviceInterest}`,
          message: fullMessage,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || 'Failed to submit your inquiry. Please try again or reach out via WhatsApp.'
        );
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Something went wrong while submitting your request. Please try again.';
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-[#fff1dc] text-[#c75e0a] border border-[#FF9933]/30 mb-3">
            <Globe className="w-4 h-4 text-[#FF9933]" />
            <span>Dedicated Assistance for Non-Resident Indians (NRI Land Desk)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Overseas Indian Land &amp; Property Advisory
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-3 max-w-3xl leading-relaxed">
            Specialized legal diligence, FEMA regulatory guidance, ancestral property search, and direct-to-owner transactions across India for NRIs &amp; OCIs.
          </p>

          {origin && (
            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200">
              <span className="text-slate-400">Regional Gateway:</span>
              <strong className="text-[#FF9933]">{origin}</strong>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-10">
        {/* Quick Highlights / Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#fff1dc] flex items-center justify-center text-[#c75e0a]">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">30-Year Title Search</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Independent verification of link documents, sub-registrar Encumbrance Certificates (Form 15), and revenue passbooks (Dharani/Bhulekh/Meebhoomi).
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#fff1dc] flex items-center justify-center text-[#c75e0a]">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">FEMA &amp; RBI Compliance</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clear guidance on permissible property types (residential, commercial) vs restrictions on direct agricultural land purchase without RBI clearance.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#fff1dc] flex items-center justify-center text-[#c75e0a]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">PoA Adjudication</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Advisory on consular attestation of Special Power of Attorney (SPoA) abroad and subsequent adjudication at District Registrar offices in India.
            </p>
          </div>
        </div>

        {/* Form and Direct WhatsApp Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900">Schedule Priority NRI Consultation</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Our legal and property verification desk will review your requirements and respond within 24 hours (IST).
            </p>

            {submitted ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-emerald-900">Inquiry Received Successfully</h3>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                  Thank you for contacting BhoomiMitra NRI Land Desk. A senior advisor will review your submitted property details and email you a tailored guidance report.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        country: origin || '',
                        serviceInterest: 'Ancestral Title Verification & Due Diligence',
                        message: '',
                      });
                    }}
                    className="text-xs font-bold text-emerald-800 underline hover:text-emerald-900 cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-[#FF9933] focus:border-[#FF9933] bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="rajesh@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-[#FF9933] focus:border-[#FF9933] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-slate-700 mb-1">
                      International Phone / WhatsApp
                    </label>
                    <input
                      id="phone"
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+971 50 123 4567 or +1 415 555 2671"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-[#FF9933] focus:border-[#FF9933] bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-xs font-bold text-slate-700 mb-1">
                      Current Country of Residence
                    </label>
                    <input
                      id="country"
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g. UAE, United States, United Kingdom"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-[#FF9933] focus:border-[#FF9933] bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="serviceInterest" className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Area of Inquiry
                  </label>
                  <select
                    id="serviceInterest"
                    value={formData.serviceInterest}
                    onChange={(e) => setFormData({ ...formData, serviceInterest: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-[#FF9933] focus:border-[#FF9933] bg-white cursor-pointer"
                  >
                    <option value="Ancestral Title Verification & Due Diligence">
                      Ancestral Title Search &amp; Due Diligence
                    </option>
                    <option value="Direct Purchase of Plots / Farmstay Land">
                      Exploring Direct-to-Owner Plots / Farmstay Land
                    </option>
                    <option value="FEMA / RBI Regulatory Compliance Advice">
                      FEMA / RBI Legal Permissibility for NRIs
                    </option>
                    <option value="Power of Attorney (PoA) Adjudication">
                      Special Power of Attorney (SPoA) Drafting &amp; Adjudication
                    </option>
                    <option value="General Overseas Landowner Assistance">
                      Other Overseas Landowner Inquiry
                    </option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-bold text-slate-700 mb-1">
                    Inquiry Details / Location of Interest <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe the state/city (e.g. Hyderabad, Bengaluru, Punjab), survey number if known, or your exact investment/sale query..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-[#FF9933] focus:border-[#FF9933] bg-white resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit NRI Assistance Request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar Advisory & Direct Connect */}
          <div className="lg:col-span-5 space-y-6">
            {/* Direct Connect Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Instant WhatsApp Desk</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect with our overseas coordinator for rapid document questions or listing inquiries via WhatsApp.
              </p>
              <a
                href="https://wa.me/919999999999?text=Hello%20BhoomiMitra%20NRI%20Desk,%20I%20would%20like%20assistance%20with%20land%20in%20India."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                <span>Chat on WhatsApp (+91 99999 99999)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* FEMA Legal Primer */}
            <div className="bg-[#fffbf5] p-6 rounded-2xl border border-[#FF9933]/30 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-[#c75e0a]">
                <Scale className="w-4 h-4" />
                <span>FEMA Regulatory Note</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 leading-relaxed list-disc list-inside">
                <li>
                  <strong>Residential &amp; Commercial:</strong> NRIs and OCIs can freely acquire residential and commercial properties without RBI approval.
                </li>
                <li>
                  <strong>Agricultural Land:</strong> NRIs cannot directly purchase agricultural land, plantation properties, or farmhouses unless inherited from an Indian resident or specifically approved by the Reserve Bank of India.
                </li>
                <li>
                  <strong>Repatriation:</strong> Sale proceeds of permissible property can be repatriated abroad up to USD 1 Million per financial year under the FEMA LRS facility through authorized dealer banks.
                </li>
              </ul>
            </div>

            {/* Return to Marketplace */}
            <div className="text-center pt-2">
              <Link
                href="/buy"
                className="text-xs font-bold text-[#c75e0a] hover:text-[#9e490f] inline-flex items-center gap-1.5"
              >
                <span>Explore Direct Classifieds on BhoomiMitra</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function NriContactPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF9933]" />
        </div>
      }
    >
      <NriContactContent />
    </Suspense>
  );
}
