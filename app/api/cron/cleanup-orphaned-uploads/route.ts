import { NextRequest, NextResponse } from 'next/server';
import { cleanupOrphanedUploads } from '@/services/upload.service';
import { verifyCronRequest } from '@/lib/security/cron-auth';

export const dynamic = 'force-dynamic';

/**
 * Daily Scheduled Job: Cleans up orphaned R2 files.
 * Fixes B-2: Deletes files uploaded to R2 that are not referenced by any MongoDB property.
 *
 * Query options:
 * - ?dryRun=true: Preview objects that would be deleted without deleting
 * - ?olderThanHours=24: Change cutoff window (default 24h)
 */
export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid or missing cron secret.' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const dryRun = searchParams.get('dryRun') === 'true';
    const olderThanHoursParam = searchParams.get('olderThanHours');
    const olderThanHours = olderThanHoursParam ? parseInt(olderThanHoursParam, 10) : 24;

    const result = await cleanupOrphanedUploads({
      dryRun,
      olderThanHours: Number.isNaN(olderThanHours) ? 24 : olderThanHours,
    });

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        result,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron:cleanup-orphaned-uploads] Failed:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
