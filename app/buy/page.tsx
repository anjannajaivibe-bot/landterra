import React from 'react';
import { getProperties } from '@/services/property.service';
import type { IProperty } from '@/types/property';
import { BuyPageClient } from './BuyPageClient';
import { Footer } from '@/components/layout/Footer';
import { DueDiligenceChecklist } from '@/components/legal/DueDiligenceChecklist';

export const dynamic = 'force-dynamic';

export default async function BuyPage() {
  let initialData: { data: IProperty[]; total: number; totalPages: number } = {
    data: [],
    total: 0,
    totalPages: 1,
  };

  try {
    const result = await getProperties({
      page: 1,
      limit: 6,
      cardOnly: true,
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