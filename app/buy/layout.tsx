import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Land & Verified Plots in India | LandTerra',
  description:
    'Browse verified residential plots, commercial land, and farmlands with registered sale deeds and survey records. Zero broker commission.',
  openGraph: {
    title: 'Find Land & Verified Plots in India | LandTerra',
    description:
      'Browse verified residential plots, commercial land, and farmlands with registered sale deeds and survey records. Zero broker commission.',
  },
};

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
