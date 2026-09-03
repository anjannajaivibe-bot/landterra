import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Compass,
  ShieldCheck,
  LandPlot,
  Users,
  Building2,
  Scale,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  MapPin,
  FileText,
  TrendingUp,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-slate-950 text-white py-16 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-[#fff1dc] text-[#c75e0a] border border-[#FF9933]/30 mb-4">
            <Compass className="w-4 h-4 text-[#FF9933]" />
            <span>Our Mission &amp; Marketplace Model</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            India&apos;s Direct Land &amp; Plot Classifieds Marketplace
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-4 max-w-2xl leading-relaxed">
            BhoomiMitra (भू-मित्र) connects land sellers directly with prospective buyers across India, eliminating middleman brokerages through transparent seller disclosures, satellite mapping, and a flat advertising model.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-12 text-slate-700 leading-relaxed">
        {/* Value Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#fff1dc] border border-[#FF9933]/20 flex items-center justify-center text-[#c75e0a]">
              <LandPlot className="w-6 h-6 text-[#FF9933]" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Direct to Owner</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Zero broker commissions. Buyers communicate directly with genuine landowners and authorized representatives.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Transparent Disclosure</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Sellers share revenue survey numbers and document references to assist buyers during independent due diligence.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-800">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Geo-Spatial Precision</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Interactive Google Satellite views with state-specific unit conversions and seller location privacy controls.
            </p>
          </div>
        </div>

        {/* Section 1: The Problem with Traditional Classifieds */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700">
            <span>The Challenge</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            The Problem with Traditional Indian Land Markets
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            For decades, buying and selling land in India has been a stressful and friction-filled financial experience:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1.5">
              <strong className="text-rose-950 font-bold block">Ghost &amp; Duplicate Listings</strong>
              <p className="text-rose-900/80 leading-relaxed text-xs">
                Unregulated portals allow brokers to copy photos, invent fake prices, and advertise plots they do not represent.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1.5">
              <strong className="text-rose-950 font-bold block">Heavy Brokerage Commissions</strong>
              <p className="text-rose-900/80 leading-relaxed text-xs">
                Traditional brokers routinely demand 2% to 4% commission from both sides, siphoning lakhs from transactions.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1.5">
              <strong className="text-rose-950 font-bold block">Lack of Pre-Inspection Diligence</strong>
              <p className="text-rose-900/80 leading-relaxed text-xs">
                Buyers often travel hours to inspect land without knowing basic revenue survey details or road access realities.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1.5">
              <strong className="text-rose-950 font-bold block">Unit Measurement Confusion</strong>
              <p className="text-rose-900/80 leading-relaxed text-xs">
                Fragmented state measurement units (Guntas, Cents, Bighas, Acres) confuse buyers evaluating properties.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: The BhoomiMitra Solution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#c75e0a]">
            <span>The BhoomiMitra Advantage</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            How We Are Transforming Land Classifieds
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            BhoomiMitra re-engineers the land marketplace with direct connectivity, technology, and transparency:
          </p>

          <div className="space-y-3.5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-[#fff1dc] text-[#c75e0a] shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-[#FF9933]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">1. Direct Classifieds &amp; Seller Undertakings</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sellers submit listings directly and accept formal legal declarations regarding ownership and accuracy. Listings publish instantly upon flat-fee payment without middleman interference.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-[#fff1dc] text-[#c75e0a] shrink-0 mt-0.5">
                <HeartHandshake className="w-5 h-5 text-[#FF9933]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">2. Flat Listing Fee • 0% Deal Commissions</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sellers pay a nominal flat listing fee (₹10–₹25 for 30 days) to host their advertisement. When your land sells, you keep 100% of the sale proceeds.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-[#fff1dc] text-[#c75e0a] shrink-0 mt-0.5">
                <LandPlot className="w-5 h-5 text-[#FF9933]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">3. Universal Land Area Normalization</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our system automatically translates between Square Yards, Guntas, Cents, Acres, and Hectares so buyers from anywhere in India can compare land accurately.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Who We Serve */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-5">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Who BhoomiMitra is Built For
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-slate-900 block font-bold">🌾 Agricultural Farmers &amp; Landowners</strong>
              <p className="text-slate-600 text-xs">Reach serious buyers directly across India and avoid paying heavy middleman commissions.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-slate-900 block font-bold">🏡 Farmhouse &amp; Weekend Plot Enthusiasts</strong>
              <p className="text-slate-600 text-xs">Discover farmland plots with road access, soil details, and direct seller contact.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-slate-900 block font-bold">🏘️ Long-Term Land Investors &amp; NRIs</strong>
              <p className="text-slate-600 text-xs">Explore direct landowner listings across high-growth highway corridors with full due diligence guidance.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-slate-900 block font-bold">🏢 Commercial &amp; Industrial Developers</strong>
              <p className="text-slate-600 text-xs">Acquire commercial road-facing bits, warehouse acreage, and layout plots directly.</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="p-8 rounded-3xl bg-slate-950 text-white text-center space-y-5 border border-slate-800">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to find or list your land?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Join thousands of landowners and buyers across India experiencing a commission-free, transparent, and modern land marketplace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/buy"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all"
            >
              Explore Land Listings
            </Link>
            <Link
              href="/sell"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
            >
              <span>List Your Property</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
