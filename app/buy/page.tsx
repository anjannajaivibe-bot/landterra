import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { getProperties } from '@/services/property.service';
import { RESULTS_PER_PAGE } from '@/components/buy/types';
import { BuyPageClient } from './BuyPageClient';
import { BuyPageSkeleton } from '@/components/buy/BuySkeletons';

export const metadata: Metadata = {
  title: 'Direct Real Estate & Properties Marketplace | BhoomiMitra',
  description:
    'Browse direct owner properties — plots, apartments, houses, villas, commercial spaces, and farmlands across India with zero broker commissions.',
};

export default async function BuyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const query = typeof params.query === 'string' ? params.query : undefined;
  const city = typeof params.city === 'string' ? params.city : undefined;
  const state = typeof params.state === 'string' ? params.state : undefined;
  const landType = typeof params.landType === 'string' ? params.landType : undefined;
  const propertyType = typeof params.propertyType === 'string' ? params.propertyType : undefined;
  const bhk = typeof params.bhk === 'string' ? params.bhk : undefined;
  const sortBy = (typeof params.sortBy === 'string' ? params.sortBy : 'newest') as any;
  const page = Number(params.page) || 1;
  const verifiedOnly = params.verifiedOnly === 'true';
  const minPrice = Number(params.minPrice) || undefined;
  const maxPrice = Number(params.maxPrice) || undefined;
  const minArea = Number(params.minArea) || undefined;
  const maxArea = Number(params.maxArea) || undefined;

  let initialData = { data: [], total: 0, totalPages: 1 };

  try {
    const result = await getProperties({
      query,
      city,
      state,
      landType,
      propertyType,
      bhk,
      verifiedOnly,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      sortBy,
      page,
      limit: RESULTS_PER_PAGE,
      cardOnly: true,
    });

    initialData = {
      data: JSON.parse(JSON.stringify(result.data)),
      total: result.total,
      totalPages: result.totalPages,
    };
  } catch (err) {
    console.warn('Server-side property preload failed, client will fetch fallback:', err);
  }

  return (
    <Suspense fallback={<BuyPageSkeleton />}>
      <BuyPageClient
        initialProperties={initialData.data}
        initialTotal={initialData.total}
        initialTotalPages={initialData.totalPages}
      />
    </Suspense>
  );
}