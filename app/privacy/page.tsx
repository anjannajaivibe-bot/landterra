import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Lock, ShieldCheck, Database, EyeOff } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <div className="bg-slate-900 text-white py-10 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy & Document Security</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">How we protect title deeds and personal contact details</p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 bg-white my-8 rounded-2xl border border-slate-200 p-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <Lock className="w-5 h-5 text-emerald-700 mb-2" />
            <h3 className="font-bold text-slate-900 text-xs mb-1">Encrypted R2 Storage</h3>
            <p className="text-[11px] text-slate-500">
              Uploaded sale deeds and private revenue extracts are encrypted and never made publicly scrapable.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <EyeOff className="w-5 h-5 text-emerald-700 mb-2" />
            <h3 className="font-bold text-slate-900 text-xs mb-1">Location Privacy</h3>
            <p className="text-[11px] text-slate-500">
              Sellers can choose to mask exact pinpoints with a 400m approximate radius.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <ShieldCheck className="w-5 h-5 text-emerald-700 mb-2" />
            <h3 className="font-bold text-slate-900 text-xs mb-1">Anti-Scraping Gateway</h3>
            <p className="text-[11px] text-slate-500">
              Buyer inquiries are routed through verified platform messaging to prevent telemarketing spam.
            </p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
          <p>
            We collect seller contact information, property location coordinates, government land registration IDs, and official title deed scans exclusively for verification and facilitating transaction inquiries.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Who Has Access to Uploaded Title Documents</h2>
          <p>
            Private documents (such as sale deeds, 7/12 extracts, and Khata certificates) are restricted exclusively to authorized BhoomiMitra compliance administrators. They are never published on the public marketplace.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
