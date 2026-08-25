import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Lock,
  ShieldCheck,
  EyeOff,
  Database,
  FileCheck2,
  Key,
  Server,
  UserCheck,
  Mail,
  Scale,
} from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-emerald-400 border border-slate-800 mb-3">
            <Lock className="w-4 h-4" />
            <span>Privacy & Document Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Privacy Policy & Document Security
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-3 max-w-2xl leading-relaxed">
            Learn how BhoomiMitra protects your title deeds, contact credentials, and property coordinates with modern encryption, access controls, and strict confidentiality.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
        {/* Visual Security Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Encrypted Secure Vault</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Uploaded title deeds and revenue extracts are stored in private encrypted cloud vaults and are never indexed on the public web.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Location Privacy</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sellers can toggle an approximate 400m radius blur to keep exact parcel boundaries confidential until direct contact.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Zero Data Selling</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We never sell or rent your personal contact details, mobile numbers, or browsing habits to third-party telemarketers.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          {/* Section 1 */}
          <section className="space-y-3 pb-6 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-700 font-mono">1.</span>
              <span>Information We Collect</span>
            </h2>
            <p>
              BhoomiMitra collects personal, geospatial, and property data strictly necessary for providing our land classifieds marketplace:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>User Account Information:</strong> Name, verified Google OAuth email address, profile avatar, and verified mobile telephone number.</li>
              <li><strong>Property Listing Data:</strong> Geographic coordinates (latitude/longitude), village, tehsil, district, state, asking price, boundary descriptions, road width, and soil classification.</li>
              <li><strong>Revenue & Ownership Documents:</strong> Uploaded scans of Registered Sale Deeds, 7/12 (Satbara) extracts, Pahani/Patta Passbooks, Encumbrance Certificates (EC), and Government Survey IDs.</li>
              <li><strong>Transaction & Payment Metadata:</strong> Order identifiers, payment timestamps, and subscription receipt records (financial payment card details are tokenized securely by authorized payment partners and never stored on our servers).</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 pb-6 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-700 font-mono">2.</span>
              <span>How We Use Your Data</span>
            </h2>
            <p>The information we collect is utilized exclusively for:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Authenticating your account via secure single-use verification challenges and authenticated sign-in.</li>
              <li>Auditing title documentation to grant the &quot;Verified Property&quot; badge and prevent fraudulent postings.</li>
              <li>Displaying your land advertisement to potential buyers with accurate map filtering.</li>
              <li>Routing buyer-to-seller inquiries via platform messaging and notifying you by email or SMS.</li>
              <li>Maintaining immutable compliance audit logs for platform trust and safety operations.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 pb-6 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-700 font-mono">3.</span>
              <span>Confidentiality of Uploaded Title Documents</span>
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <p className="font-semibold text-slate-900">
                Uploaded land deeds and private revenue extracts are treated as strictly confidential:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Uploaded deeds are stored in private encrypted cloud vaults protected by secure access tokens.</li>
                <li>Documents are <strong>never indexed by search engine crawlers</strong> (Google, Bing, etc.).</li>
                <li>Only authorized BhoomiMitra compliance officers have access to inspect documents during the verification review.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 pb-6 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-700 font-mono">4.</span>
              <span>Authorized Service Integrations</span>
            </h2>
            <p>
              We partner with industry-leading infrastructure providers who adhere to strict data security and regulatory compliance standards:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-1">PCI-DSS Compliant Payment Gateways</strong>
                <span className="text-slate-600">Bank-grade encrypted tokenization for processing classifieds publishing fees.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-1">Encrypted Cloud Storage</strong>
                <span className="text-slate-600">Encrypted distributed object storage for property media and private verification files.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-1">Mapping & Geolocation Services</strong>
                <span className="text-slate-600">Secure geo-spatial mapping services for location visualization.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-1">Carrier-Grade Messaging Gateways</strong>
                <span className="text-slate-600">Transactional email delivery and one-time verification passcode dispatch.</span>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 pb-6 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-700 font-mono">5.</span>
              <span>Data Retention & User Rights</span>
            </h2>
            <p>
              You retain complete control over your personal data. You may at any time:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Edit or update your contact details and active property listings from your dashboard.</li>
              <li>Pause or permanently delete any property listing, which removes all associated public content.</li>
              <li>Request full account deletion and document erasure by submitting a request to our support desk.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-700 font-mono">6.</span>
              <span>Grievance Officer & Contact Details</span>
            </h2>
            <p>
              In accordance with the <strong>Information Technology Act, 2000</strong> and rules made thereunder, the contact details of the Grievance Officer for privacy and data protection concerns are:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p><strong>Grievance & Privacy Officer:</strong> Compliance Team, BhoomiMitra</p>
              <p><strong>Email:</strong> <span className="font-mono text-emerald-800">privacy@bhoomimitra.com</span></p>
              <p><strong>Address:</strong> BhoomiMitra Technologies, Hyderabad, Telangana, India</p>
            </div>
          </section>
        </div>

        {/* Contact Footer */}
        <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base">Need assistance with your data or privacy?</h3>
            <p className="text-xs text-slate-400 mt-0.5">Submit an inquiry to our dedicated data privacy desk.</p>
          </div>
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold transition-colors shrink-0"
          >
            Contact Privacy Desk
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
