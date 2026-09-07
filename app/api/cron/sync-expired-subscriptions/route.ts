import { NextRequest, NextResponse } from 'next/server';
import { syncExpiredProperties } from '@/services/property.service';
import { verifyCronRequest } from '@/lib/security/cron-auth';

export const dynamic = 'force-dynamic';

/**
 * Daily Scheduled Job: Synchronize expired subscriptions.
 * Fixes B-5: Transitions properties whose subscription has expired (both PUBLISHED and EXPIRING_SOON)
 * to EXPIRED so that no expired listings remain visible on the marketplace or deep links.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid or missing cron secret.' },
      { status: 401 }
    );
  }

  try {
    const result = await syncExpiredProperties({ sendAlerts: true });

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        expiredCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        expiringAlertsSent: result.expiringAlertsSent || 0,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron:sync-expired-subscriptions] Failed:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
