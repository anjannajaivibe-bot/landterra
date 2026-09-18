'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  HeartHandshake,
  Scale,
  Phone,
  Tag,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { HeroSearchSection } from './home/HeroSearchSection';
import { FeaturedPropertiesSection } from './home/FeaturedPropertiesSection';

import { IProperty } from '@/types/property';
import { IUser } from '@/types/user';

/* Dynamic Heavy Modules */
const LandAreaConverter = dynamic(
  () => import('@/components/tools/LandAreaConverter').then((mod) => mod.LandAreaConverter),
  { ssr: true }
);

const DueDiligenceChecklist = dynamic(
  () => import('@/components/legal/DueDiligenceChecklist').then((mod) => mod.DueDiligenceChecklist),
  { ssr: true }
);

const AuthModal = dynamic(
  () => import('@/components/auth/AuthModal').then((mod) => mod.AuthModal),
  { ssr: false }
);

export interface HomePageClientProps {
  initialProperties?: IProperty[];
  initialListingFee?: number;
  initialListingDurationDays?: number;
  footer?: React.ReactNode;
}

export function HomePageClient({
  initialProperties = [],
  initialListingFee = 10,
  initialListingDurationDays = 30,
  footer,
}: HomePageClientProps) {
  const [properties, setProperties] = useState<IProperty[]>(initialProperties);
  const [loading, setLoading] = useState(!initialProperties || initialProperties.length === 0);

  /* Platform settings */
  const [publicListingFee, setPublicListingFee] = useState(initialListingFee);
  const [listingDurationDays, setListingDurationDays] = useState(initialListingDurationDays);

  /* User & Auth */
  const [user, setUser] = useState<Partial<IUser> | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  /* ================================================================
     LOAD REAL DATA & SESSION
  ================================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const needsProperties = !initialProperties || initialProperties.length === 0;
        const [propsRes, settingsRes] = await Promise.all([
          needsProperties ? fetch('/api/properties?limit=12&cardOnly=true') : Promise.resolve(null),
          fetch('/api/settings/public').catch(() => null),
        ]);

        if (settingsRes && 'ok' in settingsRes && settingsRes.ok) {
          const s = await settingsRes.json();
          if (!cancelled) {
            if (typeof s.listingFeeAmount === 'number') setPublicListingFee(s.listingFeeAmount);
            if (typeof s.listingFeeDurationDays === 'number') setListingDurationDays(s.listingFeeDurationDays);
          }
        }

        if (propsRes && 'ok' in propsRes && propsRes.ok) {
          const result = await propsRes.json();
          if (!cancelled && Array.isArray(result?.data)) {
            setProperties(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to load portal data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [initialProperties]);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-[#FF9933] selection:text-white">
      <Navbar />

      <main className="flex-1 space-y-16 pb-20">
        {/* 1. HERO PORTAL SEARCH SECTION */}
        <HeroSearchSection />

        {/* 2. FOUR VALUE PILLARS (Clean Minimalist White Cards) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-labelledby="platform-highlights-heading">
          <h2 id="platform-highlights-heading" className="sr-only">
            Why Choose BhoomiMitra Platform Highlights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center font-bold">
                <HeartHandshake className="w-5 h-5 text-[#FF9933]" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-950">0% Broker Commission</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Deal directly with genuine property owners. No middleman cuts, broker markups, or success commissions.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center font-bold">
                <Scale className="w-5 h-5 text-[#FF9933]" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-950">Buyer Due Diligence Guide</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Inspect 30-year sale deed chains, EC Form 15, Pahani/7-12 extracts, and FMB sketches before finalizing deals.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center font-bold">
                <Phone className="w-5 h-5 text-[#FF9933]" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-950">Direct &quot;Call Owner&quot;</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Call verified property owners directly. Inquiries are safely logged in your dashboard for total transparency.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center font-bold">
                <Tag className="w-5 h-5 text-[#FF9933]" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-950">Flat ₹{publicListingFee} for {listingDurationDays} Days</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Transparent and affordable classifieds publishing fee for sellers with zero commission upon sale.
              </p>
            </div>
          </div>
        </section>

        {/* 3. REAL FEATURED PROPERTIES SECTION */}
        <FeaturedPropertiesSection
          properties={properties}
          loading={loading}
          publicListingFee={publicListingFee}
          listingDurationDays={listingDurationDays}
          onRequireLogin={() => setAuthModalOpen(true)}
        />

        {/* 4. LAND BUYER'S DUE DILIGENCE CHECKLIST */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DueDiligenceChecklist />
        </section>

        {/* 5. INTERACTIVE INDIAN LAND AREA CONVERTER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandAreaConverter />
        </section>

        {/* 5. "SELL YOUR LAND" HIGH-CONVERSION BANNER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-950 via-[#7f3e10] to-[#c75e0a] text-white p-8 sm:p-12 shadow-xl border border-[#FF9933]/30">
            <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[#ffe1b8] text-[11px] font-bold border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
                <span>For Direct Property Owners</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Are You a Property Owner? Sell or Rent in 3 Simple Steps
              </h2>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Publish your plot, flat, villa, or commercial property for a flat advertisement fee of just{' '}
                <strong className="text-[#FF9933] font-extrabold">
                  ₹{publicListingFee} for {listingDurationDays} Days
                </strong>
                . Zero broker commission upon sale or lease. Reach thousands of serious buyers &amp; tenants across India.
              </p>

              {/* 3 Step indicators */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/10 border border-white/15">
                  <div className="w-6 h-6 rounded-full bg-[#FF9933] text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <span className="font-semibold text-white">Enter Property Details &amp; Price</span>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/10 border border-white/15">
                  <div className="w-6 h-6 rounded-full bg-[#FF9933] text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <span className="font-semibold text-white">Upload Photos &amp; Proofs</span>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/10 border border-white/15">
                  <div className="w-6 h-6 rounded-full bg-[#FF9933] text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <span className="font-semibold text-white">Pay ₹{publicListingFee} &amp; Go Live</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/sell"
                  prefetch={false}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#FF9933] hover:bg-[#f07d12] text-white text-xs font-black shadow-lg transition-all hover:shadow-[#FF9933]/30 cursor-pointer"
                >
                  <span>Post Your Property Listing Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/listing-rules"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-[#ffe1b8] hover:underline"
                >
                  <span>Read Listing Guidelines</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 6. MULTI-COLUMN SEO DIRECTORY (Clean Real Routes) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="border-t border-slate-200 pt-8">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-6">
              Explore Properties &amp; Plots by State, Category &amp; Legal Guides
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-5 text-xs">
              <div className="space-y-2">
                <div className="font-bold text-slate-900">Properties by State</div>
                <ul className="space-y-1.5 text-slate-500">
                  <li>
                    <Link href="/buy?state=Telangana" className="hover:text-[#FF9933]">
                      Properties in Telangana
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?state=Andhra+Pradesh" className="hover:text-[#FF9933]">
                      Properties in Andhra Pradesh
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?state=Karnataka" className="hover:text-[#FF9933]">
                      Properties in Karnataka
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?state=Maharashtra" className="hover:text-[#FF9933]">
                      Properties in Maharashtra
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?state=Tamil+Nadu" className="hover:text-[#FF9933]">
                      Properties in Tamil Nadu
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900">Properties by Category</div>
                <ul className="space-y-1.5 text-slate-500">
                  <li>
                    <Link href="/buy?landType=FLAT,DUPLEX,PENTHOUSE" className="hover:text-[#FF9933]">
                      Flats &amp; Apartments
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?landType=VILLA,HOUSE_VILLA,INDEPENDENT_HOUSE" className="hover:text-[#FF9933]">
                      Houses &amp; Luxury Villas
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?landType=OPEN_PLOT,FARMLAND_PLOT,GATED_COMMUNITY_PLOT,RESIDENTIAL_PLOT" className="hover:text-[#FF9933]">
                      Open &amp; Gated Layout Plots
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?landType=COMMERCIAL_LAND,OFFICE_SPACE,RETAIL_SHOP,SHOWROOM" className="hover:text-[#FF9933]">
                      Commercial &amp; Retail Spaces
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?landType=AGRICULTURAL_LAND,FARM_HOUSE_LAND" className="hover:text-[#FF9933]">
                      Farmlands &amp; Farmhouses
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900">Popular Corridors</div>
                <ul className="space-y-1.5 text-slate-500">
                  <li>
                    <Link href="/buy?query=Kokapet" className="hover:text-[#FF9933]">
                      Kokapet &amp; Neopolis Plots
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?query=Shamshabad" className="hover:text-[#FF9933]">
                      Shamshabad Airport Zone
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?query=Moinabad" className="hover:text-[#FF9933]">
                      Moinabad Farmlands
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?query=Shankarpally" className="hover:text-[#FF9933]">
                      Shankarpally Residential Plots
                    </Link>
                  </li>
                  <li>
                    <Link href="/buy?query=Devanahalli" className="hover:text-[#FF9933]">
                      Devanahalli Bengaluru Rural
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900">Help &amp; Legal Guides</div>
                <ul className="space-y-1.5 text-slate-500">
                  <li>
                    <Link href="/pricing" className="hover:text-[#FF9933]">
                      Listing Pricing &amp; Plans
                    </Link>
                  </li>
                  <li>
                    <Link href="/listing-rules" className="hover:text-[#FF9933]">
                      Classifieds Publishing Rules
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-[#FF9933]">
                      Grievance &amp; Customer Support
                    </Link>
                  </li>
                  <li>
                    <Link href="/refund-policy" className="hover:text-[#FF9933]">
                      Refund Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-[#FF9933]">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      {footer}

      {/* Authentication Modal */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      )}
    </div>
  );
}

export default HomePageClient;