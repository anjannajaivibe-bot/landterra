import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Dashboard | LandTerra',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
