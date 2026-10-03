import { NextResponse } from 'next/server';

import mongoose from 'mongoose';

import {
  connectToDatabase,
  isMongoConfigured,
} from '@/lib/db/mongodb';

export const dynamic =
  'force-dynamic';

export async function GET() {
  const startedAt =
    Date.now();

  let databaseReady =
    false;

  if (isMongoConfigured()) {
    try {
      const connection =
        await connectToDatabase();

      databaseReady = Boolean(
        connection &&
          mongoose.connection
            .readyState === 1,
      );
    } catch (error) {
      console.error(
        '[Healthcheck] Database check failed:',
        error,
      );
    }
  }

  const healthy =
    databaseReady;

  return NextResponse.json(
    {
      status: healthy
        ? 'healthy'
        : 'degraded',
      timestamp:
        new Date().toISOString(),
      responseTimeMs:
        Date.now() - startedAt,
    },
    {
      status: healthy
        ? 200
        : 503,
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate',
      },
    },
  );
}
