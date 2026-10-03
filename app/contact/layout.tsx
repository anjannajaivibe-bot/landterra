import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Contact BhoomiMitra | Support & Grievance Desk',
  },
  description:
    'Contact BhoomiMitra for property marketplace support, seller listing assistance, customer inquiries and grievance redressal.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact BhoomiMitra | Support & Grievance Desk',
    description:
      'Contact BhoomiMitra for property marketplace support, seller listing assistance, customer inquiries and grievance redressal.',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
