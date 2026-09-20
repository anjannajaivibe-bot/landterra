import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'List Your Property Across India | BhoomiMitra',
  description:
    'Individuals, companies, and agents can submit eligible property listings across India. BhoomiMitra currently charges ₹0 platform listing fee, and submitted listings follow the platform review workflow.',
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
