import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, FileText, Scale } from 'lucide-react';
import { LEGAL_DISCLAIMER } from '@/config/constants';

export default function ListingRulesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <div className="bg-slate-950 text-white py-12 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Integrity & Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Listing Rules & Verification Guidelines
          </h1>
          <p className="text-slate-300 text-sm mt-2">
            Understanding BhoomiMitra&apos;s publishing fee model, mandatory title inspection, and prohibited listings.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Section 1: Publishing Fee */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <span>1. Authoritative Publishing Fee</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            To prevent spam, ghost listings, and unauthorized broker hoarding, BhoomiMitra charges a flat upfront publishing fee for listing verification and active marketplace hosting:
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-emerald-950">
            Total Publishing Fee = Total Land Area (in Sq. Yards) × ₹10
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The publishing fee covers administrative verification, Cloudflare R2 encrypted document storage, map coordinate validation, and active marketplace hosting. <strong>Zero broker commission is charged upon sale completion.</strong>
          </p>
        </div>

        {/* Section 2: Verification Criteria */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>2. Mandatory Verification Requirements</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            To earn the &quot;Verified Property&quot; badge, the seller must supply:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Government Registration / Survey ID:</strong> Verifiable against state portals (e.g. Dharani, Kaveri, Bhulekh, IGR).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Title Deed Scans:</strong> Clear copies of registered sale deeds or 7/12 extract proving seller title pedigree.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Accurate Geo-coordinates:</strong> Physical site coordinates matching cadastral village boundaries.</span>
            </li>
          </ul>
        </div>

        {/* Section 3: Prohibited Listings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span>3. Strictly Prohibited Listings</span>
          </h2>
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
            <p>The following listings will be rejected or banned immediately without refund:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Encroached, disputed, or litigation-bound land parcels.</li>
              <li>Government assigned lands (e.g. Inam, Wakf, Poramboke, Forest reserve lands).</li>
              <li>Unsanctioned unauthorized layouts violating master plan land-use zoning.</li>
              <li>Listings submitted by brokers claiming ownership without valid Power of Attorney (PoA).</li>
            </ul>
          </div>
        </div>

        {/* Statutory disclaimer */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Statutory Legal Disclaimer</span>
          </div>
          <p className="leading-relaxed">{LEGAL_DISCLAIMER}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
