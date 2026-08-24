import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Dashboard | BhoomiMitra',
  description: 'Manage your land listings, buyer inquiries, and subscriptions on BhoomiMitra.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
