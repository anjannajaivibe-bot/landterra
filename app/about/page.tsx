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
  FileCheck2,
  TrendingUp,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-slate-950 text-white py-16 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 mb-4">
            <Compass className="w-4 h-4" />
            <span>Our Mission & Vision</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Building India&apos;s Most Trusted Land Trading Network
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-4 max-w-2xl leading-relaxed">
            BhoomiMitra (भू-मित्र) is on a mission to eliminate real estate opacity, duplicate broker listings, and predatory commissions by connecting buyers directly with verified landowners.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-12 text-slate-700 leading-relaxed">
        {/* Value Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
              <LandPlot className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Direct to Owner</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Zero middleman markup or broker commissions. Buyers communicate directly with genuine landowners and authorized title holders.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Verified Title Audits</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every verified listing is cross-checked against official state revenue portals (Pahani, Passbook, 7/12 extract, EC, and Survey IDs).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-800">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Geo-Spatial Precision</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Interactive Google Maps pin drops with state-specific unit conversion and seller radius privacy protection.
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
            For decades, buying and selling land in India has been one of the most stressful, opaque, and friction-filled financial experiences:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1.5">
              <strong className="text-rose-950 font-bold block">Ghost & Duplicate Listings</strong>
              <p className="text-rose-900/80 leading-relaxed text-xs">
                Unregulated portals allow brokers to copy photos, invent fake prices, and advertise plots they do not own or represent.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1.5">
              <strong className="text-rose-950 font-bold block">Heavy Brokerage Commissions</strong>
              <p className="text-rose-900/80 leading-relaxed text-xs">
                Traditional brokers routinely demand 2% to 4% commission from both sides, siphoning lakhs of rupees from hard-working families.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1.5">
              <strong className="text-rose-950 font-bold block">Unverified Title Claims</strong>
              <p className="text-rose-900/80 leading-relaxed text-xs">
                Buyers often travel hours to inspect land, only to discover government ceiling issues, court stays, or boundary litigation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1.5">
              <strong className="text-rose-950 font-bold block">Unit Measurement Confusion</strong>
              <p className="text-rose-900/80 leading-relaxed text-xs">
                Fragmented state measurement units (Guntas in Telangana/Karnataka, Cents in TN/Kerala, Bighas in the North) confuse non-local buyers.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: The BhoomiMitra Solution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <span>The BhoomiMitra Standard</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            How We Are Transforming Land Trading
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            BhoomiMitra re-engineers the land marketplace with technology, verification, and transparency:
          </p>

          <div className="space-y-3.5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">1. Administrative Revenue & Title Auditing</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We check seller ownership documents against official state land registries (e.g., Dharani, Kaveri, Bhulekh, Meebhoomi) before awarding the Verified badge.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">2. Flat Listing Fee • 0% Deal Commissions</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sellers pay a nominal flat directory listing fee (₹10–₹25 for 30 days) to host their advertisement. When your land sells, you keep 100% of the sale proceeds.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                <LandPlot className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">3. Universal Land Area Normalization</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our system seamlessly translates between Square Yards, Guntas, Cents, Acres, and Hectares so buyers from anywhere in India can compare land accurately.
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
              <strong className="text-slate-900 block font-bold">🌾 Agricultural Farmers & Landowners</strong>
              <p className="text-slate-600 text-xs">Reach genuine buyers directly and avoid paying hefty middleman cuts on your ancestral lands.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-slate-900 block font-bold">🏡 Farmhouse & Weekend Plot Enthusiasts</strong>
              <p className="text-slate-600 text-xs">Discover serene, verified farmland plots with clear road access, soil data, and water connectivity.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-slate-900 block font-bold">🏘️ Long-Term Land Investors & NRIs</strong>
              <p className="text-slate-600 text-xs">Invest in transparent, title-audited plots across emerging high-growth highway corridors.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-slate-900 block font-bold">🏢 Commercial & Industrial Developers</strong>
              <p className="text-slate-600 text-xs">Acquire large-scale commercial road-facing bits, warehouse acreage, and approved layouts.</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="p-8 rounded-3xl bg-slate-950 text-white text-center space-y-5 border border-slate-800">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to find or list your land?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Join thousands of landowners and buyers across India experiencing a commission-free, verified, and modern land trading marketplace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/buy"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all"
            >
              Explore Verified Land
            </Link>
            <Link
              href="/sell"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
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
