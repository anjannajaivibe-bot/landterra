import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Compass,
  MapPinOff,
  Search,
  PlusCircle,
  Home,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

export const metadata = {
  title: '404 - Page Not Found | BhoomiMitra',
  description: 'The requested land listing or page could not be found on BhoomiMitra.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-center">
        {/* Visual Badge */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[#fff1dc] text-[#c75e0a] border border-[#FF9933]/30 mb-6 shadow-2xs">
          <MapPinOff className="w-4 h-4 text-[#FF9933]" />
          <span>Error 404 • Location Not Located</span>
        </div>

        {/* Big Code & Title */}
        <div className="relative mb-4">
          <span className="text-8xl sm:text-9xl font-black text-slate-200 select-none">
            404
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 absolute inset-0 flex items-center justify-center tracking-tight">
            Land Listing or Page Not Found
          </h1>
        </div>

        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
          The property listing, survey number, or page you are looking for may have been sold, unpublished by the owner, expired, or relocated.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-12">
          <Link
            href="/buy"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white text-sm font-bold transition-all shadow-md hover:shadow-lg"
          >
            <Search className="w-4 h-4" />
            <span>Explore Active Marketplace</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-sm font-semibold transition-all shadow-2xs"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Quick Search Suggestions */}
        <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-left">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#FF9933]" />
            <span>Popular Land Searches in Telangana &amp; Andhra Pradesh</span>
          </h2>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/buy?city=Hyderabad"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#fff1dc] hover:text-[#c75e0a] text-xs font-semibold text-slate-700 transition-colors"
            >
              Hyderabad Plots
            </Link>
            <Link
              href="/buy?city=Rangareddy"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#fff1dc] hover:text-[#c75e0a] text-xs font-semibold text-slate-700 transition-colors"
            >
              Rangareddy Farmlands
            </Link>
            <Link
              href="/buy?city=Sangareddy"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#fff1dc] hover:text-[#c75e0a] text-xs font-semibold text-slate-700 transition-colors"
            >
              Sangareddy Highway Land
            </Link>
            <Link
              href="/buy?landType=AGRICULTURAL_LAND"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#fff1dc] hover:text-[#c75e0a] text-xs font-semibold text-slate-700 transition-colors"
            >
              Agricultural &amp; Organic Farms
            </Link>
            <Link
              href="/buy?landType=RESIDENTIAL_PLOT"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#fff1dc] hover:text-[#c75e0a] text-xs font-semibold text-slate-700 transition-colors"
            >
              HMDA &amp; DTCP Approved Plots
            </Link>
            <Link
              href="/sell"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>List Your Property</span>
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>Looking for assistance with a specific property inquiry?</span>
            <Link
              href="/contact"
              className="text-[#c75e0a] font-semibold hover:underline inline-flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Contact BhoomiMitra Support</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
