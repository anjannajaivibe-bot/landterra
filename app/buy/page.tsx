import React from 'react';
import { getProperties } from '@/services/property.service';
import { RESULTS_PER_PAGE } from '@/components/buy/types';
import { BuyPageClient } from './BuyPageClient';

export default async function BuyPage() {
  let initialData = { data: [], total: 0, totalPages: 1 };

  try {
    const result = await getProperties({
      page: 1,
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
    <BuyPageClient
      initialProperties={initialData.data}
      initialTotal={initialData.total}
      initialTotalPages={initialData.totalPages}
    />
  );
}