import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Console | BhoomiMitra',
  description: 'BhoomiMitra platform administration and property verification console.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
