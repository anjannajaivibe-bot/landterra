import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellation and Refund Policy | BhoomiMitra',
  description:
    'Cancellation and refund policy for BhoomiMitra digital property listing and advertising services.',
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900">
          Cancellation and Refund Policy
        </h1>

        <p className="mt-5 text-slate-600 leading-7">
          BhoomiMitra charges sellers for digital property advertisement
          publishing services. Payments made to BhoomiMitra are not payments
          toward the purchase, booking, registration or transfer of property.
        </p>

        <div className="mt-10 space-y-8 text-slate-600 leading-7">
          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Failed or incomplete payments
            </h2>

            <p className="mt-3">
              If a payment fails or is not successfully captured, the listing
              will not be treated as paid. Any amount debited but not
              successfully received by BhoomiMitra is normally reversed by the
              applicable bank or payment provider according to their processing
              timelines.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Duplicate payments
            </h2>

            <p className="mt-3">
              Verified duplicate payments for the same listing service may be
              reviewed for refund after the corresponding payment records have
              been confirmed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Listing cancellation
            </h2>

            <p className="mt-3">
              Sellers may pause or remove listings using available account
              controls. Removal of a published advertisement does not
              automatically create a refund entitlement for service already
              provided.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Service not delivered
            </h2>

            <p className="mt-3">
              If BhoomiMitra receives payment but cannot provide the purchased
              digital listing service because of a verified BhoomiMitra system
              or processing error, the seller may contact support for review
              and, where appropriate, a refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Property transactions
            </h2>

            <p className="mt-3">
              BhoomiMitra does not collect property sale consideration,
              booking advances, token amounts, registration charges or buyer
              payments to sellers. Property transaction disputes and refunds
              between buyers and sellers are therefore outside BhoomiMitra's
              digital listing payment service.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
