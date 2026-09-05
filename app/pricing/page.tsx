import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  SITE_CONFIG,
  SELLER_LISTING_FEE_DESCRIPTION,
} from '@/config/constants';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  CreditCard,
  HeartHandshake,
  TrendingDown,
  Sparkles,
  Lock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing & Publishing Plans | BhoomiMitra',
  description:
    'Transparent digital classifieds pricing for Indian landowners. Flat listing fee for 30 days of active visibility with 0% brokerage or success commission.',
};

export default function PricingPage() {
  const listingFee = 10;
  const durationDays = 30;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-slate-950 text-white py-16 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-[#fff1dc] text-[#c75e0a] border border-[#FF9933]/30 mb-4">
            <CreditCard className="w-4 h-4 text-[#FF9933]" />
            <span>Transparent Classifieds Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Seller Listing Pricing &amp; 0% Brokerage
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-4 max-w-2xl leading-relaxed">
            Sell your agricultural plots, farmhouses, or commercial land directly to serious buyers. Pay only a nominal flat fee to host your advertisement and keep 100% of your sale proceeds.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-12 text-slate-700 leading-relaxed">
        {/* Value Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#fff1dc] border border-[#FF9933]/20 flex items-center justify-center text-[#c75e0a]">
              <Zap className="w-6 h-6 text-[#FF9933]" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Flat Digital Ad Fee</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Just ₹10 – ₹25 flat fee to publish your property for {durationDays} active days. No hidden renewal charges or surprise bills.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-800">
              <HeartHandshake className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">0% Commission Ever</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We never take a cut of your property deal. Whether your land sells for ₹10 Lakhs or ₹10 Crores, you keep every rupee.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No Auto-Debit</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Single one-time payment. After {durationDays} days, your listing gracefully pauses until you manually choose to reactivate it.
            </p>
          </div>
        </div>

        {/* Pricing Plan Card */}
        <div className="bg-white rounded-3xl border-2 border-[#FF9933]/40 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#FF9933] text-white text-[11px] font-extrabold uppercase tracking-wider py-1.5 px-5 rounded-bl-2xl">
            Single Transparent Plan
          </div>

          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c75e0a] bg-[#fff1dc] border border-[#FF9933]/30 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
              <span>Direct Classifieds Listing</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight">
                ₹{listingFee} – ₹25
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-500">
                / {durationDays} Days Active Visibility
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              {SELLER_LISTING_FEE_DESCRIPTION}
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider">
                Included Features
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
                  <span><strong>{durationDays}-Day Public Hosting:</strong> Indexed across search and map discovery.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
                  <span><strong>Direct Live Publishing:</strong> Goes live immediately upon successful payment.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
                  <span><strong>Private Document Vault:</strong> Encrypted storage for optional title and survey scans.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
                  <span><strong>Geo-Privacy Blur:</strong> 50–100m radius toggle to shield exact boundaries.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider">
                Seller Benefits
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
                  <span><strong>Direct Buyer Leads:</strong> Inquiries routed straight to your dashboard and phone.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
                  <span><strong>Seller Dashboard:</strong> Real-time view count, inquiry tracking, and updates.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
                  <span><strong>Multi-Image Showcase:</strong> Upload high-resolution boundary and site images.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
                  <span><strong>0% Commission:</strong> Zero success fees or broker cuts upon land deal closing.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Ready to advertise your land parcel?
            </span>
            <Link
              href="/sell"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>List Your Property Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Savings Comparison Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#fff1dc] text-[#c75e0a]">
              <TrendingDown className="w-5 h-5 text-[#FF9933]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Brokerage Savings Comparison
              </h2>
              <p className="text-xs text-slate-500">
                See how much money you save compared to traditional real estate broker commission fees
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-900">
                  <th className="py-3.5 px-4 font-bold rounded-l-xl">Land Deal Value</th>
                  <th className="py-3.5 px-4 font-bold text-rose-700">Traditional Broker (2%–4%)</th>
                  <th className="py-3.5 px-4 font-bold text-[#c75e0a]">BhoomiMitra</th>
                  <th className="py-3.5 px-4 font-bold text-slate-950 rounded-r-xl">Your Net Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">₹25 Lakhs</td>
                  <td className="py-3.5 px-4 text-rose-600 line-through">₹50,000 – ₹1,00,000</td>
                  <td className="py-3.5 px-4 font-extrabold text-[#c75e0a]">₹{listingFee} – ₹25</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">Save ₹49,975+</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">₹50 Lakhs</td>
                  <td className="py-3.5 px-4 text-rose-600 line-through">₹1,00,000 – ₹2,00,000</td>
                  <td className="py-3.5 px-4 font-extrabold text-[#c75e0a]">₹{listingFee} – ₹25</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">Save ₹99,975+</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">₹1 Crore</td>
                  <td className="py-3.5 px-4 text-rose-600 line-through">₹2,00,000 – ₹4,00,000</td>
                  <td className="py-3.5 px-4 font-extrabold text-[#c75e0a]">₹{listingFee} – ₹25</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">Save ₹1,99,975+</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">₹5 Crores</td>
                  <td className="py-3.5 px-4 text-rose-600 line-through">₹10,00,000 – ₹20,00,000</td>
                  <td className="py-3.5 px-4 font-extrabold text-[#c75e0a]">₹{listingFee} – ₹25</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">Save ₹9,99,975+</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* What BhoomiMitra Does Not Collect */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FF9933]" />
            <span>What BhoomiMitra Never Collects</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To maintain regulatory clarity as an advertising classifieds marketplace, BhoomiMitra does not handle financial sale transactions:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span><strong>No Property Consideration:</strong> We never hold or escrow land purchase funds.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span><strong>No Token / Advance Amounts:</strong> Advance payments are negotiated directly between parties.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span><strong>No Stamp Duty or Taxes:</strong> Registration fees and taxes are paid to state revenue portals.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span><strong>No Success Commissions:</strong> We do not ask for a cut when you register your deed.</span>
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#FF9933]" />
            <span>Frequently Asked Questions</span>
          </h2>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <strong className="text-slate-900 block font-bold">When does the 30-day listing period begin?</strong>
              <p className="text-slate-600 leading-relaxed text-xs">
                Your 30-day visibility period begins immediately upon completing payment for your listing advertisement.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <strong className="text-slate-900 block font-bold">Can I renew or extend my listing after 30 days?</strong>
              <p className="text-slate-600 leading-relaxed text-xs">
                Yes. If your land parcel hasn&apos;t sold within 30 days, you can renew it anytime directly from your Seller Dashboard with a single click.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <strong className="text-slate-900 block font-bold">When does my listing go live after payment?</strong>
              <p className="text-slate-600 leading-relaxed text-xs">
                Immediately. In our direct classifieds marketplace, your listing is published live on the platform instantly upon successful flat-fee payment, with zero administrative queues or delays.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <strong className="text-slate-900 block font-bold">Are there any hidden costs for buyers?</strong>
              <p className="text-slate-600 leading-relaxed text-xs">
                No. Browsing properties, searching on maps, filtering land types, and contacting landowners is 100% free for all buyers.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-8 rounded-3xl bg-slate-950 text-white text-center space-y-5 border border-slate-800">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to list your property directly?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Reach thousands of serious buyers across India with zero middleman commissions and direct peer-to-peer contact.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/sell"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Publish Property</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-all border border-slate-700"
            >
              Have Questions? Contact Us
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
