import React from 'react';
import type { Metadata } from 'next';
import { getProperties } from '@/services/property.service';
import { HomePageClient } from './HomePageClient';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    absolute: "Direct Properties, Homes & Plots Across India | BhoomiMitra",
  },
  description:
    "Discover verified properties across India — residential plots, flats, luxury villas, commercial spaces, and agricultural land. Connect directly with genuine owners with zero broker commissions.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Direct Properties, Homes & Plots Across India | BhoomiMitra",
    description:
      "Discover verified properties across India — residential plots, flats, luxury villas, commercial spaces, and agricultural land. Connect directly with genuine owners with zero broker commissions.",
    type: 'website',
  },
};

export default async function HomePage() {
  let initialProperties = [];
  const publicListingFee = 10;
  const listingDurationDays = 30;

  try {
    const result = await getProperties({ limit: 12, cardOnly: true });
    if (result && Array.isArray(result.data)) {
      initialProperties = JSON.parse(JSON.stringify(result.data));
    }
  } catch (error) {
    console.error('Failed to preload properties on homepage server:', error);
  }

  return (
    <HomePageClient
      initialProperties={initialProperties}
      initialListingFee={publicListingFee}
      initialListingDurationDays={listingDurationDays}
      footer={<Footer />}
    />
  );
}