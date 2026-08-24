import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Land & Verified Plots in India | BhoomiMitra',
  description:
    'Search verified residential plots, commercial land, farmlands, and industrial plots across India. Complete document transparency with zero brokerage.',
  openGraph: {
    title: 'Find Land & Verified Plots in India | BhoomiMitra',
    description:
      'Search verified residential plots, commercial land, farmlands, and industrial plots across India. Complete document transparency with zero brokerage.',
  },
};

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
