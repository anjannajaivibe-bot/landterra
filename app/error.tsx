'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  AlertTriangle,
  RotateCcw,
  Search,
  Home,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected runtime client error for observability
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full text-center">
        {/* Visual Badge */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 mb-6 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Application Error • System Guard Triggered</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4">
          Something Unexpected Happened
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto mb-8 leading-relaxed">
          We experienced an issue while rendering this page. Your data and account remain safe. You can try refreshing the view or return to the marketplace.
        </p>

        {error?.digest && (
          <div className="mb-6 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 font-mono text-[11px]">
            Incident Ref: {error.digest}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-10">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/buy"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-sm font-semibold transition-all shadow-2xs"
          >
            <Search className="w-4 h-4" />
            <span>Go to Marketplace</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all shadow-2xs"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>

        {/* Support Card */}
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff1dc] border border-[#FF9933]/20 flex items-center justify-center text-[#c75e0a] shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#FF9933]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs">Need technical assistance?</h3>
              <p className="text-[11px] text-slate-500">Our support desk is available to assist you.</p>
            </div>
          </div>

          <Link
            href="/contact"
            className="text-xs font-bold text-[#c75e0a] hover:underline flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-lg hover:bg-amber-50"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help Desk</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
