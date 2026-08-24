import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LEGAL_DISCLAIMER } from '@/config/constants';
import { Scale } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <div className="bg-slate-900 text-white py-10 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Last updated: January 2025</p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 bg-white my-8 rounded-2xl border border-slate-200 p-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-xs">
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800">
          <strong>Key Summary:</strong> {LEGAL_DISCLAIMER}
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using BhoomiMitra Marketplace (&quot;Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Marketplace Role and Verification Scope</h2>
          <p>
            BhoomiMitra functions strictly as a technology marketplace connecting property owners and prospective buyers. The platform facilitates property listings and communication between users. It does not itself guarantee ownership, title, legality, or authenticity of a property unless the platform explicitly completes and records an applicable verification process.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Publishing Fee & No Refund Policy</h2>
          <p>
            The ₹10 per square yard fee is charged for listing processing, server storage, document analysis, and queue verification. Fees are non-refundable once administrative inspection commences.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Seller Obligations & Legal Title Warranties</h2>
          <p>
            Sellers warrant that all information, Government Registration IDs, and uploaded deed scans are authentic, unencumbered, and free from undisclosed litigations. Fraudulent submissions will result in permanent blacklisting and legal action.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
