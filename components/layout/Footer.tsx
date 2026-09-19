import React from 'react';
import Link from 'next/link';
import {
  Compass,
  ShieldCheck,
  Lock,
  PhoneCall,
  Mail,
  MapPin,
  HeartHandshake,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Scale,
} from 'lucide-react';
import { SITE_CONFIG } from '@/config/constants';

export function Footer() {
  return (
    <footer className="bg-white text-slate-700 text-sm border-t-2 border-[#FF9933]/30">
      {/* ── Top Trust Matrix (3 Elevated Saffron & White Cards) ── */}
      <div className="border-b border-slate-100 bg-gradient-to-b from-[#fffbf5] to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4 p-6 rounded-3xl bg-white border border-[#FF9933]/20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-[#FF9933]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-slate-950 font-black text-sm">
                Direct Seller Marketplace
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Individuals, companies and agents can list property with seller-provided information. Buyers can contact the listed seller directly.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-3xl bg-white border border-[#FF9933]/20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-[#FF9933]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-slate-950 font-black text-sm">
                Private Document Vault
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Optional seller deeds and survey extracts are encrypted and kept confidential from public search crawlers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-3xl bg-white border border-[#FF9933]/20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6 text-[#FF9933]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-slate-950 font-black text-sm">
                0% Platform Brokerage
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                BhoomiMitra does not charge buyers or sellers a brokerage percentage or success fee on the property transaction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Multi-Column Directory ── */}
      <div className="max-w-7xl mx-auto py-14 px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10">
        {/* Col 1: Brand & Bio (Spans 2 cols on mobile/tablet) */}
        <div className="sm:col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FF9933] text-white flex items-center justify-center shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div className="leading-none">
              <span className="flex items-center text-xl font-black text-slate-950 tracking-tight">
                Bhoomi<span className="text-[#FF9933]">Mitra</span>
              </span>
              <span className="mt-0.5 block text-[11px] font-bold text-slate-500">
                Property Marketplace
              </span>
            </div>
          </Link>

          <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
            India-focused property marketplace for sale, rent and lease. Explore plots, homes, commercial spaces and hospitality properties and contact the listed seller directly.
          </p>

          <div className="space-y-2.5 pt-2 text-xs">
            <div className="flex items-center gap-2.5 text-slate-800 font-bold">
              <Mail className="w-4 h-4 text-[#FF9933] shrink-0" />
              <span>{SITE_CONFIG.supportEmail}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-800 font-bold">
              <PhoneCall className="w-4 h-4 text-[#FF9933] shrink-0" />
              <span>{SITE_CONFIG.contactPhone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-800 font-bold">
              <MapPin className="w-4 h-4 text-[#FF9933] shrink-0" />
              <span>Hyderabad, Telangana, India</span>
            </div>
          </div>
        </div>

        {/* Col 2: For Buyers */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-950">
            For Buyers &amp; Tenants
          </h4>
          <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
            <li>
              <Link href="/buy" className="hover:text-[#FF9933] transition-colors">
                Explore All Properties
              </Link>
            </li>
            <li>
              <Link href="/buy?landType=RESIDENTIAL_PLOT,FLAT" className="hover:text-[#FF9933] transition-colors">
                Residential Plots &amp; Flats
              </Link>
            </li>
            <li>
              <Link href="/buy?landType=AGRICULTURAL_LAND,FARMLAND_PLOT" className="hover:text-[#FF9933] transition-colors">
                Farmland &amp; Agriculture
              </Link>
            </li>
            <li>
              <Link href="/buy?landType=COMMERCIAL_LAND,OFFICE_SPACE,RETAIL_SHOP" className="hover:text-[#FF9933] transition-colors">
                Commercial &amp; Retail Land
              </Link>
            </li>
            <li>
              <Link href="/buy?verifiedOnly=true" className="hover:text-[#FF9933] transition-colors">
                Reviewed Listings
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: For Sellers */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-950">
            For Sellers
          </h4>
          <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
            <li>
              <Link
                href="/sell"
                prefetch={false}
                className="inline-flex items-center gap-1.5 text-[#c75e0a] font-black hover:text-[#FF9933] transition-colors"
              >
                <span>+ List Your Property</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/seller" prefetch={false} className="hover:text-[#FF9933] transition-colors">
                Seller Dashboard
              </Link>
            </li>
            <li>
              <Link href="/listing-rules" className="hover:text-[#FF9933] transition-colors">
                Listing Information
              </Link>
            </li>
            <li>
              <Link href="/listing-rules" className="hover:text-[#FF9933] transition-colors">
                Classifieds Publishing Rules
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[#FF9933] transition-colors">
                Seller Grievance Desk
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Trust & Legal Guides */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-950">
            Trust &amp; Legal
          </h4>
          <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
            <li>
              <Link href="/about" className="hover:text-[#FF9933] transition-colors">
                About BhoomiMitra
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-[#FF9933] transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-[#FF9933] transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-[#FF9933] transition-colors">
                Refund &amp; Cancellation Policy
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[#FF9933] transition-colors">
                Grievance Officer
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Statutory Indian Land Due Diligence Advisory ── */}
      <div className="border-t border-slate-100 bg-[#fffbf5] py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-2 max-w-4xl">
            <Scale className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
            <span>
              <strong>Buyer Due Diligence Advisory:</strong> BhoomiMitra is an online property marketplace connecting listed sellers with buyers and tenants. BhoomiMitra does not verify ownership, title, boundaries, measurements, encumbrances, approvals, land-use status, litigation status, or the authenticity of documents. Buyers should independently verify the property with independent legal counsel before entering into any transaction.
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-700 font-bold shrink-0">
            <span>🇮🇳 Made for Indian Property</span>
            <span>•</span>
            <span>0% Platform Brokerage</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Copyright Bar ── */}
      <div className="border-t border-slate-200 bg-white py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} BhoomiMitra Property Marketplace. All rights reserved.
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold">
            <Link href="/sitemap.xml" className="hover:text-[#FF9933] transition-colors">
              Sitemap
            </Link>
            <Link href="/contact" className="hover:text-[#FF9933] transition-colors">
              Help &amp; Grievances
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
