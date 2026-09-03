import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Direct Land & Plots Marketplace in India | BhoomiMitra',
  description:
    'Search residential plots, commercial land, farmlands, and industrial plots across India. Connect directly with genuine landowners with zero brokerage.',
  openGraph: {
    title: 'Direct Land & Plots Marketplace in India | BhoomiMitra',
    description:
      'Search residential plots, commercial land, farmlands, and industrial plots across India. Connect directly with genuine landowners with zero brokerage.',
  },
};

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
