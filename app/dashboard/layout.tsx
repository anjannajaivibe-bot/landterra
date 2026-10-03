import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Dashboard',
  description: 'Manage your BhoomiMitra account, property listings, buyer inquiries and marketplace activity.'
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
