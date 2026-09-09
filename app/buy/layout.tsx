import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Direct Real Estate & Properties Marketplace | BhoomiMitra',
  },
  description:
    'Browse direct owner properties — plots, apartments, houses, villas, commercial spaces, and farmlands across India with zero broker commissions.',
  alternates: {
    canonical: '/buy',
  },
  openGraph: {
    title: 'Direct Real Estate & Properties Marketplace | BhoomiMitra',
    description:
      'Browse direct owner properties — plots, apartments, houses, villas, commercial spaces, and farmlands across India with zero broker commissions.',
  },
};

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
