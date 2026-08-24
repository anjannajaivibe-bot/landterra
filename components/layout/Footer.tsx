import React from 'react';
import Link from 'next/link';
import { Compass, ShieldCheck, Lock, FileText, PhoneCall, Mail } from 'lucide-react';
import { SITE_CONFIG } from '@/config/constants';

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-900">
      {/* Top Value / Trust Highlights */}
      <div className="border-b border-slate-850 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-1">Human Admin Verified Records</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Registered sale deeds, 7/12 extracts, and government registration survey IDs are inspected before publication.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-1">Private Document Security</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Property deeds and title extracts are securely encrypted with access strictly limited to verified owners and admins.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-1">Transparent Publishing Model</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fixed flat fee of ₹10 per square yard. Zero hidden brokerage or broker commissions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Col 1: Brand */}
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Land<span className="text-emerald-400">Terra</span>
            </span>
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-4">
            India&apos;s premier verified land and plot marketplace. Connecting legitimate land owners with serious buyers through verified document records and map intelligence.
          </p>
          <div className="flex flex-col gap-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>{SITE_CONFIG.supportEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>{SITE_CONFIG.contactPhone}</span>
            </div>
          </div>
        </div>

        {/* Col 2: For Buyers */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">For Buyers</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/buy" className="hover:text-white transition-colors">Browse Verified Lands</Link></li>
            <li><Link href="/buy?landType=RESIDENTIAL_PLOT" className="hover:text-white transition-colors">Residential Plots</Link></li>
            <li><Link href="/buy?landType=COMMERCIAL_LAND" className="hover:text-white transition-colors">Commercial Lands</Link></li>
            <li><Link href="/buy?landType=AGRICULTURAL_LAND" className="hover:text-white transition-colors">Farmlands & Groves</Link></li>
            <li><Link href="/dashboard/buyer" className="hover:text-white transition-colors">Saved Favorites</Link></li>
          </ul>
        </div>

        {/* Col 3: For Sellers */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">For Sellers</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/sell" className="hover:text-white transition-colors">List Your Property</Link></li>
            <li><Link href="/#calculator" className="hover:text-white transition-colors">Publishing Fee (₹10/yd)</Link></li>
            <li><Link href="/dashboard/seller" className="hover:text-white transition-colors">Seller Dashboard</Link></li>
            <li><Link href="/listing-rules" className="hover:text-white transition-colors">Verification Criteria</Link></li>
            <li><Link href="/dashboard/seller#inquiries" className="hover:text-white transition-colors">Buyer Inquiries</Link></li>
          </ul>
        </div>

        {/* Col 4: Trust & Legal */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Trust & Legal</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy & Documents</Link></li>
            <li><Link href="/listing-rules" className="hover:text-white transition-colors">Listing Rules & Escrow</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">About LandTerra</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Compliance</Link></li>
          </ul>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-black/80 border-t border-slate-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} LandTerra Marketplace Technologies Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-3 sm:mt-0 text-xs">
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link href="/listing-rules" className="hover:text-slate-400 transition-colors">Rules</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
