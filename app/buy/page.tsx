import React from 'react';
import { getProperties } from '@/services/property.service';
import type { IProperty } from '@/types/property';
import { BuyPageClient } from './BuyPageClient';
import { Footer } from '@/components/layout/Footer';
import { DueDiligenceChecklist } from '@/components/legal/DueDiligenceChecklist';

export const dynamic = 'force-dynamic';

interface BuyPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BuyPage({ searchParams }: BuyPageProps) {
  const resolved = searchParams ? await searchParams : {};

  const query = typeof resolved.query === 'string' ? resolved.query.trim() : undefined;
  const city = typeof resolved.city === 'string' ? resolved.city.trim() : undefined;
  const state = typeof resolved.state === 'string' ? resolved.state.trim() : undefined;
  const landType = typeof resolved.landType === 'string' ? resolved.landType.trim() : undefined;
  const bhk = typeof resolved.bhk === 'string' ? resolved.bhk.trim() : undefined;
  const minPrice = typeof resolved.minPrice === 'string' ? Number(resolved.minPrice) : undefined;
  const maxPrice = typeof resolved.maxPrice === 'string' ? Number(resolved.maxPrice) : undefined;
  const minArea = typeof resolved.minArea === 'string' ? Number(resolved.minArea) : undefined;
  const maxArea = typeof resolved.maxArea === 'string' ? Number(resolved.maxArea) : undefined;
  const verifiedOnly = resolved.verifiedOnly === 'true';
  const sortBy = typeof resolved.sortBy === 'string' ? resolved.sortBy : 'newest';
  const page = typeof resolved.page === 'string' ? Number(resolved.page) : 1;

  const effectiveCity = city && city !== 'All India' ? city : undefined;
  const effectiveState = state && state !== 'ALL' ? state : undefined;

  let initialData: { data: IProperty[]; total: number; totalPages: number } = {
    data: [],
    total: 0,
    totalPages: 1,
  };

  try {
    const result = await getProperties({
      page: page || 1,
      limit: 6,
      cardOnly: true,
      query: query || effectiveCity || undefined,
      city: effectiveCity,
      state: effectiveState,
      landType: landType as any,
      bhk,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      verifiedOnly,
      sortBy: sortBy as any,
    });

    initialData = {
      data: result.data,
      total: result.total,
      totalPages: result.totalPages,
    };
  } catch (err) {
    console.warn('Server-side property preload failed, client will fetch fallback:', err);
  }

  return (
    <BuyPageClient
      initialProperties={initialData.data}
      initialTotal={initialData.total}
      initialTotalPages={initialData.totalPages}
      dueDiligence={<DueDiligenceChecklist />}
      footer={<Footer />}
    />
  );
}