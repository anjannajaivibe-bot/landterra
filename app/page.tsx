import React from 'react';
import type { Metadata } from 'next';
import { getProperties } from '@/services/property.service';
import type { IProperty } from '@/types/property';
import { HomePageClient } from './HomePageClient';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    absolute: "Direct Properties, Homes & Plots Across India | BhoomiMitra",
  },
  description:
    "Explore residential plots, apartments, villas, commercial spaces, and agricultural land across India. Connect directly with genuine property owners with zero broker commissions.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Direct Properties, Homes & Plots Across India | BhoomiMitra",
    description:
      "Explore residential plots, apartments, villas, commercial spaces, and agricultural land across India. Connect directly with genuine property owners with zero broker commissions.",
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let initialProperties: IProperty[] = [];
  const publicListingFee = 10;
  const listingDurationDays = 30;

  try {
    const result = await getProperties({ limit: 12, cardOnly: true });
    if (result && Array.isArray(result.data)) {
      initialProperties = result.data;
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