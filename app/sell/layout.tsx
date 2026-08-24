import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell Your Land Parcel Direct to Buyers | BhoomiMitra',
  description:
    'List residential, commercial, or agricultural land with verified survey details and connect directly with genuine buyers across India.',
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
