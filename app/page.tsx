import React from 'react';
import type { Metadata } from 'next';
import { getProperties } from '@/services/property.service';
import type { IProperty } from '@/types/property';
import { HomePageClient } from './HomePageClient';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    absolute: "Properties for Sale, Rent & Lease Across India | BhoomiMitra",
  },
  description:
    "Explore property for sale, rent and lease across India, including plots, homes, commercial spaces and hospitality properties. Contact the listed seller directly. BhoomiMitra charges no platform brokerage.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Direct Properties, Homes & Plots Across India | BhoomiMitra",
    description:
      "Explore property for sale, rent and lease across India, including plots, homes, commercial spaces and hospitality properties. Contact the listed seller directly. BhoomiMitra charges no platform brokerage.",
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let initialProperties: IProperty[] = [];
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
      footer={<Footer />}
    />
  );
}