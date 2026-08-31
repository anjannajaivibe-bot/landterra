import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seller Listing Pricing | BhoomiMitra',
  description:
    'BhoomiMitra charges sellers a transparent flat digital property advertisement publishing fee with zero property sale commission.',
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900">
          BhoomiMitra Seller Listing Pricing
        </h1>

        <p className="mt-5 text-slate-600 leading-7">
          BhoomiMitra is a digital property classifieds and advertising
          platform. Sellers pay a flat publishing fee to display their property
          advertisement for a defined listing period.
        </p>

        <div className="mt-10 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900">
            Flat Digital Listing Fee
          </h2>

          <p className="mt-3 text-slate-600">
            The current listing fee and validity period are displayed before
            payment and are controlled by BhoomiMitra platform settings.
          </p>

          <p className="mt-4 font-semibold text-slate-900">
            BhoomiMitra charges zero percentage commission on the value of a
            property sale.
          </p>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">
            What the listing fee covers
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
            <li>Publishing a seller's property advertisement.</li>
            <li>Hosting listing information and property images.</li>
            <li>Seller dashboard and listing management.</li>
            <li>Buyer inquiry routing.</li>
            <li>Listing review and platform verification workflow.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">
            What BhoomiMitra does not collect
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
            <li>Property purchase price or sale consideration.</li>
            <li>Property booking or token amounts.</li>
            <li>Registration or stamp-duty charges.</li>
            <li>Brokerage or percentage-based sale commissions.</li>
          </ul>

          <p className="mt-5 text-slate-600 leading-7">
            Buyers and sellers negotiate and complete property transactions
            independently. Payments made to BhoomiMitra are solely for digital
            listing and advertising services.
          </p>
        </section>
      </section>
    </main>
  );
}
