import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sans',
});

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://landterra.vercel.app'
  ),
  title: {
    default: 'LandTerra | Verified Land & Plot Marketplace',
    template: '%s | LandTerra',
  },
  description:
    'Discover land and plots across India, review government survey records and verified title extracts, and connect directly with genuine sellers with zero brokerage.',
  keywords: [
    'land for sale in india',
    'buy land',
    'verified plots',
    'residential plots',
    'commercial land',
    'agricultural land',
    'farmland for sale',
    'land marketplace',
    'landterra',
  ],
  authors: [{ name: 'LandTerra Marketplace' }],
  creator: 'LandTerra Marketplace Technologies',
  publisher: 'LandTerra',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://landterra.vercel.app',
    siteName: 'LandTerra',
    title: 'LandTerra | Verified Land & Plot Marketplace',
    description:
      'Discover land and plots across India. Human-verified records, direct seller contact, and zero hidden commissions.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LandTerra - India Verified Land Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LandTerra | Verified Land & Plot Marketplace',
    description:
      'Discover land and plots across India. Human-verified records, direct seller contact, and zero hidden commissions.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark scroll-smooth ${plusJakartaSans.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans selection:bg-emerald-600 selection:text-white"
      >
        {children}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
