'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AlertTriangle, RotateCcw, ArrowLeft, Search, ShieldCheck } from 'lucide-react';

interface PropertyErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PropertyErrorBoundary({ error, reset }: PropertyErrorProps) {
  useEffect(() => {
    console.error('Property page error boundary triggered:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-[#c75e0a] flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-8 h-8 text-[#FF9933]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Property Details Unavailable
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              We couldn’t render this property listing right now. It might have been paused, unlisted, or there was a temporary network interruption.
            </p>
          </div>

          {error?.digest && (
            <div className="inline-block px-3 py-1 rounded-md bg-slate-100 text-[11px] font-mono text-slate-500 border border-slate-200">
              Error Ref: {error.digest}
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Loading</span>
            </button>

            <Link
              href="/buy"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Browse Other Lands</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
