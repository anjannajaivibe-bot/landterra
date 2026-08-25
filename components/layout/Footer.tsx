import React from 'react';
import Link from 'next/link';
import {
  Compass,
  ShieldCheck,
  Lock,
  FileText,
  PhoneCall,
  Mail,
  MapPin,
  HeartHandshake,
  LandPlot,
  ArrowRight,
} from 'lucide-react';
import { SITE_CONFIG } from '@/config/constants';

export function Footer() {
  return (
    <footer className="bg-white text-slate-700 text-sm border-t border-slate-200">
      {/* Top Value / Trust Highlights Section (Clean Light Cards) */}
      <div className="border-b border-slate-200 bg-slate-50/70 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-slate-950 font-extrabold text-sm">
                Human Admin Verified Records
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Registered sale deeds, 7/12 extracts, and government registration survey IDs are inspected before publication.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-slate-950 font-extrabold text-sm">
                Private Document Vault
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Property deeds and title extracts are securely encrypted with access strictly limited to authorized compliance reviewers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 text-purple-800 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-slate-950 font-extrabold text-sm">
                0% Deal Brokerage Commission
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Flat listing fee for 30-day active advertisement. Zero hidden brokerage, middleman markups, or success commissions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content & Navigation Grid */}
      <div className="max-w-7xl mx-auto py-14 px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10">
        {/* Col 1: Brand & Bio (Spans 2 cols) */}
        <div className="sm:col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-slate-950 tracking-tight">
              Bhoomi<span className="text-emerald-700">Mitra</span>
            </span>
          </Link>

          <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
            India&apos;s premier direct-to-owner land and agricultural plot classifieds platform. Connecting genuine landowners with serious buyers through verified document records and map intelligence.
          </p>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
              <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{SITE_CONFIG.supportEmail}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
              <PhoneCall className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{SITE_CONFIG.contactPhone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Hyderabad, Telangana, India</span>
            </div>
          </div>
        </div>

        {/* Col 2: For Buyers */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider">
            For Buyers
          </h4>
          <ul className="space-y-2.5 text-xs font-medium text-slate-600">
            <li>
              <Link href="/buy" className="hover:text-emerald-800 transition-colors">
                Browse Verified Lands
              </Link>
            </li>
            <li>
              <Link href="/buy?landType=RESIDENTIAL_PLOT" className="hover:text-emerald-800 transition-colors">
                Residential Plots
              </Link>
            </li>
            <li>
              <Link href="/buy?landType=AGRICULTURAL_LAND" className="hover:text-emerald-800 transition-colors">
                Farmlands & Groves
              </Link>
            </li>
            <li>
              <Link href="/buy?landType=COMMERCIAL_LAND" className="hover:text-emerald-800 transition-colors">
                Commercial Plots
              </Link>
            </li>
            <li>
              <Link href="/dashboard/buyer" className="hover:text-emerald-800 transition-colors">
                Saved Watchlist
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: For Sellers */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider">
            For Sellers
          </h4>
          <ul className="space-y-2.5 text-xs font-medium text-slate-600">
            <li>
              <Link href="/sell" className="hover:text-emerald-800 transition-colors font-bold text-emerald-700">
                + List Your Property
              </Link>
            </li>
            <li>
              <Link href="/dashboard/seller" className="hover:text-emerald-800 transition-colors">
                Seller Dashboard
              </Link>
            </li>
            <li>
              <Link href="/listing-rules" className="hover:text-emerald-800 transition-colors">
                Listing Rules & Fees
              </Link>
            </li>
            <li>
              <Link href="/dashboard/seller" className="hover:text-emerald-800 transition-colors">
                Inquiries & Billing
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-emerald-800 transition-colors">
                Seller Support Desk
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Trust & Governance */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider">
            Trust & Legal
          </h4>
          <ul className="space-y-2.5 text-xs font-medium text-slate-600">
            <li>
              <Link href="/about" className="hover:text-emerald-800 transition-colors">
                About BhoomiMitra
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-emerald-800 transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-emerald-800 transition-colors">
                Privacy & Data Security
              </Link>
            </li>
            <li>
              <Link href="/listing-rules" className="hover:text-emerald-800 transition-colors">
                Verification Guidelines
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-emerald-800 transition-colors">
                Grievance Officer
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright Bar (Clean Slate-50) */}
      <div className="bg-slate-50 border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <p className="font-medium text-center sm:text-left">
            © {new Date().getFullYear()} BhoomiMitra Technologies Inc. Direct Land Classifieds. All rights reserved.
          </p>

          <div className="flex items-center gap-6 font-bold text-slate-700">
            <Link href="/terms" className="hover:text-emerald-800 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-emerald-800 transition-colors">
              Privacy
            </Link>
            <Link href="/listing-rules" className="hover:text-emerald-800 transition-colors">
              Rules
            </Link>
            <Link href="/contact" className="hover:text-emerald-800 transition-colors">
              Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
