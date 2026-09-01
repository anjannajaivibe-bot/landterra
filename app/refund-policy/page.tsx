import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SITE_CONFIG, LEGAL_DISCLAIMER } from '@/config/constants';
import {
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Scale,
  Mail,
  ArrowRight,
  FileText,
  CreditCard,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy | BhoomiMitra',
  description:
    'Cancellation and refund policy for BhoomiMitra digital land classifieds advertising and publishing services.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-slate-950 text-white py-16 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-emerald-400 border border-slate-800 mb-4">
            <RotateCcw className="w-4 h-4" />
            <span>Fair Commerce & Billing Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Cancellation & Refund Policy
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-4 max-w-2xl leading-relaxed">
            BhoomiMitra charges sellers solely for digital property advertisement publishing and verification infrastructure. Learn about our billing rules, refund criteria, and processing timelines.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-10 text-slate-700 leading-relaxed text-xs sm:text-sm">
        {/* Important Notice Banner */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Important Classification Notice</span>
          </div>
          <p className="leading-relaxed text-xs sm:text-sm text-amber-900/90">
            Payments made to BhoomiMitra are strictly for <strong>digital advertising, listing hosting, and administrative document auditing services</strong>. BhoomiMitra is not a party to, nor does it collect, escrow, or handle any property sale considerations, token advances, booking payments, or stamp duty.
          </p>
        </div>

        {/* Policy Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Automated Payment Reversals</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Amounts deducted for failed or uncaptured transactions are reversed automatically by your issuing bank within 5–7 working days.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Duplicate Charge Refund</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If you are charged twice for the same property submission, the duplicate amount is 100% refunded to the original payment method.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Service Non-Delivery Guarantee</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If a system error on BhoomiMitra prevents listing publication, we will either resolve the issue or process a complete refund.
            </p>
          </div>
        </div>

        {/* Detailed Sections Container */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          {/* Section 1 */}
          <section className="space-y-3 pb-6 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-700 font-mono">1.</span>
              <span>Failed or Incomplete Transactions</span>
            </h2>
            <p>
              When a payment attempt fails due to network dropouts, OTP timeout, bank server downtime, or insufficient funds, the listing will remain in <strong className="text-slate-900">PAYMENT_PENDING</strong> status and will not be published.
            </p>
            <p className="text-xs text-slate-600">
              If your bank account or card was debited despite the failure, the funds remain in the inter-bank settlement pool and are typically credited back to your source account within <strong>5 to 7 business days</strong> as per Reserve Bank of India (RBI) and card network turnaround timelines.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 pb-6 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-700 font-mono">2.</span>
              <span>Duplicate Payment Claims</span>
            </h2>
            <p>
              In rare instances where a seller accidentally initiates multiple payment authorizations for the same listing order identifier:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Our automated payment gateway reconciler detects duplicate captures during nightly batch processing.</li>
              <li>Sellers may also flag duplicate charges by emailing <span className="font-semibold text-emerald-800">{SITE_CONFIG.supportEmail}</span> with the Razorpay Payment ID or transaction reference.</li>
              <li>Upon reconciliation, duplicate amounts are refunded within 3 to 5 business days to the original payment source.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 pb-6 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-700 font-mono">3.</span>
              <span>Voluntary Listing Cancellation & Pausing</span>
            </h2>
            <p>
              Sellers have full control to edit, pause, or remove their property listing at any time from their Seller Dashboard.
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <strong className="text-slate-900 block">Non-Refundability of Active / Reviewed Listings:</strong>
              <p className="text-slate-600">
                Because the listing fee is immediately applied toward encrypted deed storage, automated CDN image distribution, and human administrative document review, voluntary removal or early sale of a property does not create an entitlement to a pro-rated or full refund.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 pb-6 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-700 font-mono">4.</span>
              <span>Service Non-Delivery / Technical Outages</span>
            </h2>
            <p>
              If a seller completes payment but the property cannot be published or indexed on the marketplace due to an internal system defect, database error, or verified BhoomiMitra platform outage:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Our technical support desk will prioritize republishing and extending the visibility period free of charge.</li>
              <li>If the issue cannot be resolved within 48 hours, the seller is entitled to a full 100% refund of the publishing fee.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-700 font-mono">5.</span>
              <span>Property Transactions & Third-Party Disputes</span>
            </h2>
            <p>
              BhoomiMitra is strictly an advertising platform and does not participate in financial negotiations, token advances, earnest deposits, or final sale considerations between buyers and sellers.
            </p>
            <p className="text-xs text-slate-600">
              Any financial disagreement, title dispute, cancellation of purchase, or forfeit of token advance between buyers and sellers is governed entirely by the private agreements executed between those parties and remains outside the purview of BhoomiMitra.
            </p>
          </section>
        </div>

        {/* Refund Process & SLA Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Refund Processing Timeline & SLA</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-900">
                  <th className="py-3 px-3.5 font-bold rounded-l-lg">Scenario</th>
                  <th className="py-3 px-3.5 font-bold">Eligibility</th>
                  <th className="py-3 px-3.5 font-bold">Review Time</th>
                  <th className="py-3 px-3.5 font-bold rounded-r-lg">Payout Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="py-3 px-3.5 font-semibold text-slate-900">Duplicate Charge</td>
                  <td className="py-3 px-3.5 text-emerald-800 font-bold">Eligible (100%)</td>
                  <td className="py-3 px-3.5">24–48 Hours</td>
                  <td className="py-3 px-3.5">Original Source Account</td>
                </tr>
                <tr>
                  <td className="py-3 px-3.5 font-semibold text-slate-900">Platform Outage / Non-Delivery</td>
                  <td className="py-3 px-3.5 text-emerald-800 font-bold">Eligible (100%)</td>
                  <td className="py-3 px-3.5">24 Hours</td>
                  <td className="py-3 px-3.5">Original Source Account</td>
                </tr>
                <tr>
                  <td className="py-3 px-3.5 font-semibold text-slate-900">Voluntary Removal by Seller</td>
                  <td className="py-3 px-3.5 text-rose-800 font-bold">Not Eligible</td>
                  <td className="py-3 px-3.5">N/A</td>
                  <td className="py-3 px-3.5">N/A</td>
                </tr>
                <tr>
                  <td className="py-3 px-3.5 font-semibold text-slate-900">Failed Bank Transaction</td>
                  <td className="py-3 px-3.5 text-blue-800 font-bold">Auto-Reversal</td>
                  <td className="py-3 px-3.5">5–7 Working Days</td>
                  <td className="py-3 px-3.5">Issuing Bank Reversal</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact Desk Box */}
        <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base">Need help with a billing or refund query?</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Contact our billing team with your payment ID at <span className="font-mono text-emerald-400">{SITE_CONFIG.supportEmail}</span>
            </p>
          </div>
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold transition-colors shrink-0"
          >
            Submit Billing Query
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
