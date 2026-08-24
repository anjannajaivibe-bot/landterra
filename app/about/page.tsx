import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Compass } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <div className="bg-slate-950 text-white py-12 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-2">
            <Compass className="w-4 h-4" />
            <span>Our Mission</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">About BhoomiMitra</h1>
          <p className="text-slate-300 text-sm mt-2">
            Building India&apos;s most trusted, verified, and transparent land trading network.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 bg-white my-8 rounded-2xl border border-slate-200 p-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-xs">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">The Problem with Traditional Land Classifieds</h2>
          <p>
            For decades, land transactions across India have been plagued by duplicate broker listings, outdated records, non-existent plots, and opaque brokerage commissions that siphon away 2% to 4% of total deal values.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">The BhoomiMitra Solution</h2>
          <p>
            BhoomiMitra introduces a modern digital standard:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Upfront Flat Publishing Fee:</strong> Deters frivolous brokers and guarantees serious listings.</li>
            <li><strong>Mandatory Human Title Verification:</strong> Sale deeds and survey IDs are audited before release.</li>
            <li><strong>Zero Brokerage:</strong> Direct buyer-to-seller interactions with zero commission cut.</li>
            <li><strong>Google Maps & Privacy Radius:</strong> Precise geographic validation with seller privacy controls.</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
