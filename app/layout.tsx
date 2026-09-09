import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://bhoomimitra.com'
  ),
  title: {
    default: "BhoomiMitra | India's Direct Real Estate & Property Marketplace",
    template: '%s | BhoomiMitra',
  },
  description:
    'Discover verified properties across India — residential plots, flats, luxury villas, commercial spaces, and agricultural land. Connect directly with genuine owners with zero broker commissions.',
  keywords: [
    'properties for sale in india',
    'real estate india',
    'buy flats',
    'buy villas',
    'direct plots',
    'residential plots',
    'commercial property',
    'agricultural land',
    'farmland for sale',
    'property marketplace',
    'bhoomimitra',
    'bhoomi mitra',
  ],
  authors: [{ name: 'BhoomiMitra Marketplace' }],
  creator: 'BhoomiMitra Marketplace Technologies',
  publisher: 'BhoomiMitra',
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
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://bhoomimitra.com',
    siteName: 'BhoomiMitra',
    title: 'BhoomiMitra | Direct Real Estate & Property Marketplace',
    description:
      'Discover verified properties, homes, plots, and commercial spaces across India. Direct peer-to-peer listings, direct owner contact, and zero hidden commissions.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BhoomiMitra - India Direct Property Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BhoomiMitra | Direct Real Estate & Property Marketplace',
    description:
      'Discover land and plots across India. Direct peer-to-peer listings, direct seller contact, and zero hidden commissions.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BhoomiMitra',
  },
  icons: {
    icon: '/icon',
    apple: '/icon-192.png',
  },
  alternates: {
    types: {
      'text/plain': [{ url: '/llms.txt', title: 'LLM Agentic Manifest' }],
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://bhoomimitra.com/#website',
      url: 'https://bhoomimitra.com',
      name: 'BhoomiMitra',
      description: "India's Direct Peer-to-Peer Real Estate & Property Marketplace",
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://bhoomimitra.com/buy?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
      inLanguage: 'en-IN',
    },
    {
      '@type': 'Organization',
      '@id': 'https://bhoomimitra.com/#organization',
      name: 'BhoomiMitra Marketplace',
      url: 'https://bhoomimitra.com',
      logo: 'https://bhoomimitra.com/icon-192.png',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Support',
        areaServed: 'IN',
        availableLanguage: ['en', 'hi', 'te'],
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`scroll-smooth ${plusJakartaSans.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans selection:bg-[#FF9933] selection:text-white"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
