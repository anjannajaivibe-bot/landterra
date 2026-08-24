import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell Your Land Parcel Direct to Buyers | LandTerra',
  description:
    'List your land directly to serious buyers across India. Zero commission, ₹10/sq.yard monthly listing fee, and 100% verified buyer inquiries.',
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
