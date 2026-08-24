import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Profile | BhoomiMitra',
  description: 'Manage your unified customer profile, saved land favorites, inquiries, and properties on BhoomiMitra.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
