import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Property Marketplace for Buy, Rent & Lease | BhoomiMitra',
  },
  description:
    'Browse property listings for sale, rent and lease across India, including plots, apartments, houses, villas, commercial spaces and farmlands. Contact the listed seller directly while BhoomiMitra charges no platform brokerage.',
  alternates: {
    canonical: '/buy',
  },
  openGraph: {
    title: 'Property Marketplace for Buy, Rent & Lease | BhoomiMitra',
    description:
      'Browse property listings for sale, rent and lease across India, including plots, apartments, houses, villas, commercial spaces and farmlands. Contact the listed seller directly while BhoomiMitra charges no platform brokerage.',
  },
};

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
