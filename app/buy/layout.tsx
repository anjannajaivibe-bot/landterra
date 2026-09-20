import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Properties for Sale, Rent & Lease Across India | BhoomiMitra',
  },
  description:
    'Browse plots, apartments, houses, villas, commercial spaces, hospitality properties, and farmlands across India. Contact the listed seller directly while BhoomiMitra charges no platform brokerage.',
  alternates: {
    canonical: '/buy',
  },
  openGraph: {
    title: 'Properties for Sale, Rent & Lease Across India | BhoomiMitra',
    description:
      'Browse property across India and contact the listed individual, company, or agent seller directly. BhoomiMitra charges no platform brokerage.',
  },
};

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
