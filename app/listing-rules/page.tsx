import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Scale,
  CreditCard,
  MapPin,
  LandPlot,
  Building2,
  Sparkles,
  ArrowRight,
  Clock,
  Lock,
} from 'lucide-react';
import { LEGAL_DISCLAIMER } from '@/config/constants';

export default function ListingRulesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-slate-950 text-white py-14 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Integrity & Regulatory Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Listing Rules & Verification Standards
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-3 max-w-2xl leading-relaxed">
            BhoomiMitra is built on trust, verified ownership, and transparency. Read our complete publishing guidelines, document verification standards, and listing code of conduct.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-10">
        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
              <LandPlot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Direct Landowners</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We exclusively host genuine owners or authorized Power of Attorney holders. Ghost listings and broker hoarding are strictly prohibited.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Pre-Publish Auditing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Title deed extracts, revenue survey IDs, and GPS coordinates undergo administrative checks before listings receive verified status.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-800">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">0% Deal Commission</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Zero commission or brokerage percentage is charged on transaction completion. You only pay a flat directory listing fee.
            </p>
          </div>
        </div>

        {/* Section 1: Flat Classifieds Publishing Model */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-100/60 text-emerald-800">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">1. Digital Classifieds Listing Fee Model</h2>
              <p className="text-xs text-slate-500">Flat advertisement fee with 30-day listing lifecycle</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            To maintain listing hygiene, prevent automated spam, and eliminate unauthorized multi-broker duplicates, BhoomiMitra operates on a nominal <strong>flat digital classifieds publishing fee</strong> model:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Standard Publishing Fee</span>
              <p className="text-base font-extrabold text-emerald-900">₹10 – ₹25 flat fee</p>
              <p className="text-[11px] text-slate-600">Per property listing advertisement (configured platform-wide).</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Visibility Duration</span>
              <p className="text-base font-extrabold text-blue-900">30 Days Active Hosting</p>
              <p className="text-[11px] text-slate-600">Renewable seamlessly at any time from your Seller Dashboard.</p>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Zero Sale Commission:</strong> Sellers retain 100% of their land deal value. We charge zero brokerage, success fees, or commission percentage.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Secure Document Storage:</strong> The listing fee covers encrypted private cloud storage for title scans and automated high-resolution image processing.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>No Auto-Debits:</strong> Subscriptions do not auto-debit your bank card. When a 30-day listing expires, it simply pauses until you choose to renew it.</span>
            </li>
          </ul>
        </div>

        {/* Section 2: Verification Requirements */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-blue-100/60 text-blue-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">2. Mandatory Verification & Documentation Criteria</h2>
              <p className="text-xs text-slate-500">What is required to earn the &quot;Verified Property&quot; trust badge</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Every property submitted on BhoomiMitra must provide verifiable data points. Listings that pass administrative document review receive the prominent <strong>Verified Property Badge</strong>:
          </p>

          <div className="space-y-3.5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">State Land Revenue Survey Number</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The seller must provide an authentic government survey or sub-division number verifiable on state land portals (e.g., Dharani in Telangana, Kaveri in Karnataka, Bhulekh in UP/Maharashtra, Meebhoomi in AP, or Banglarbhumi in WB).
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">Title Deed & Revenue Record Extracts</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sellers must upload clear copies of registered sale deeds, Pattadar Passbook / 7/12 extract / Khata certificate, or Encumbrance Certificate (EC). <em>Uploaded revenue documents are stored in private encrypted vaults and are never made publicly scrapable.</em>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">Accurate GPS Site Coordinates</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pin drops must accurately match the physical land parcel. Sellers can enable the <strong>400m Privacy Radius Blur</strong> if they wish to keep exact boundaries confidential until direct buyer inquiry.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Allowed Land Categories */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-purple-100/60 text-purple-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">3. Eligible Property Categories</h2>
              <p className="text-xs text-slate-500">Categories supported on the BhoomiMitra classifieds index</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block mb-1">🌾 Agricultural Land</strong>
              <span className="text-slate-600 text-xs">Farmland, wet land, dry land, orchards, and organic agricultural parcels.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block mb-1">🏡 Farmhouse & Agro Plots</strong>
              <span className="text-slate-600 text-xs">Gated farmhouse ventures, weekend retreat plots, and managed farmland communities.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block mb-1">🏘️ Residential Plots & Layouts</strong>
              <span className="text-slate-600 text-xs">DTCP, HMDA, BDA, PMRDA, or Gram Panchayat sanctioned residential layout plots.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block mb-1">🏢 Commercial & Industrial Corridors</strong>
              <span className="text-slate-600 text-xs">Highway-facing commercial bits, warehouse land, SEZ parcels, and industrial development plots.</span>
            </div>
          </div>
        </div>

        {/* Section 4: Prohibited Listings */}
        <div className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-950">4. Strictly Prohibited & Disqualified Listings</h2>
              <p className="text-xs text-rose-700">Zero-tolerance policy on disputed and fraudulent land submissions</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-950 space-y-2.5">
            <p className="font-semibold">The following listings are strictly prohibited and will be rejected or banned immediately with permanent account debarment:</p>
            <ul className="space-y-1.5 list-disc pl-5 text-rose-900 text-xs">
              <li><strong>Government Assigned & Ceiling Lands:</strong> Inam, Wakf, Bhoodan, D-Form pattas, Poramboke, or Scheduled Caste/Tribe assigned lands violating state alienation prohibitions.</li>
              <li><strong>Litigation & Encroached Parcels:</strong> Land parcels subject to active court stay orders, partition disputes, injunctions, or illegal physical encroachments.</li>
              <li><strong>Forest & Eco-Sensitive Zones:</strong> Reserve forest boundary lands, CRZ (Coastal Regulation Zone) violations, and waterbody buffer zone encroachments (FTL/Bio-diversity zones).</li>
              <li><strong>Unauthorized Layouts:</strong> Unapproved layouts lacking master plan sanctions, layout approvals, or valid conversion certificates from revenue authorities.</li>
              <li><strong>Broker Impersonations:</strong> Unregistered agents masquerading as sole owners without valid registered Power of Attorney (PoA).</li>
            </ul>
          </div>
        </div>

        {/* Section 5: Violation Reporting & Enforcement */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-amber-100/60 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">5. Fraud Reporting & Listing Takedown Process</h2>
              <p className="text-xs text-slate-500">How our community and compliance team maintain safety</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Every property details page features a <strong>&quot;Report Listing&quot;</strong> button. When a listing is flagged with evidence of duplicate posting, misleading price, incorrect survey number, or ownership dispute, our trust & safety administrators review the claim within 24 hours. Validated reports result in immediate listing deactivation and audit recording.
          </p>
        </div>

        {/* Statutory Disclaimer */}
        <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
            <Scale className="w-4 h-4 text-amber-800" />
            <span>Statutory Due Diligence Notice</span>
          </div>
          <p className="leading-relaxed text-amber-900/90">{LEGAL_DISCLAIMER}</p>
        </div>

        {/* Quick Links CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 text-white">
          <div>
            <h4 className="font-bold text-sm sm:text-base">Have questions regarding listing your land?</h4>
            <p className="text-xs text-slate-400 mt-0.5">Our support team is here to assist with document checks and listing creation.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/contact"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors border border-slate-700"
            >
              Contact Support
            </Link>
            <Link
              href="/sell"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <span>List Property</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
