import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { SITE_CONFIG } from '@/config/constants';

export const metadata = {
  title: 'Payments & Refunds',
  description:
    'BhoomiMitra payment and refund information for marketplace users.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#c75e0a]">
            Payments &amp; Refunds
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            BhoomiMitra does not currently collect marketplace payments
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            BhoomiMitra currently does not charge a platform listing fee or platform brokerage percentage,
            and does not collect any booking amount, token amount, property sale consideration, rent, security
            deposit or lease payment through this website.
          </p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
            <section>
              <h2 className="text-base font-extrabold text-slate-950">
                Property transaction payments
              </h2>
              <p className="mt-2">
                Any payment connected with a property transaction is arranged directly
                between the buyer or tenant and the listed seller. BhoomiMitra is not an
                escrow service and does not hold or transfer property consideration.
              </p>
            </section>

            <section>
              <h2 className="text-base font-extrabold text-slate-950">
                Refund requests
              </h2>
              <p className="mt-2">
                Because BhoomiMitra currently does not collect marketplace payments,
                there is normally no BhoomiMitra payment to refund. If a charge bearing
                the BhoomiMitra name appears unexpectedly, contact support with the date,
                amount and transaction reference so it can be investigated.
              </p>
            </section>

            <section>
              <h2 className="text-base font-extrabold text-slate-950">
                Safety reminder
              </h2>
              <p className="mt-2">
                Do not send money solely because a listing appears on BhoomiMitra.
                Independently verify the property, seller identity, title, approvals and
                transaction documents before making any financial commitment.
              </p>
            </section>
          </div>

          <div className="mt-8 rounded-2xl border border-[#FF9933]/30 bg-[#fff9f0] p-5">
            <p className="text-sm font-bold text-slate-950">Need help?</p>
            <p className="mt-1 text-xs leading-6 text-slate-600">
              Contact us at{' '}
              <a
                className="font-bold text-[#c75e0a] hover:underline"
                href={`mailto:${SITE_CONFIG.supportEmail}`}
              >
                {SITE_CONFIG.supportEmail}
              </a>
              .
            </p>
          </div>

          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex rounded-xl bg-[#FF9933] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#f07d12]"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
