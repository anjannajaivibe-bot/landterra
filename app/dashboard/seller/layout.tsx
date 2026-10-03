import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Seller Dashboard | BhoomiMitra',
  },
  description:
    'Manage your BhoomiMitra property listings, review buyer inquiries, monitor listing activity and keep published property information up to date.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
