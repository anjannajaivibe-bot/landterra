import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell Your Property Direct to Buyers | BhoomiMitra',
  description:
    'List residential, commercial, or agricultural land and connect directly with genuine buyers across India with zero broker commissions.',
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
