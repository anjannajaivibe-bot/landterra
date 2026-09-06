import { NextRequest } from 'next/server';

/**
 * Verify that an incoming request to a scheduled cron route is authorized.
 * Vercel automatically passes `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
 *
 * In production:
 * - Requires a matching Bearer token or x-cron-secret header against process.env.CRON_SECRET.
 *
 * In local development:
 * - If CRON_SECRET is not configured, allows requests for local testing.
 */
export function verifyCronRequest(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();

  // In local development without CRON_SECRET configured, permit testing
  if (!cronSecret) {
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    return false;
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const customHeader = req.headers.get('x-cron-secret');
  if (customHeader && customHeader === cronSecret) {
    return true;
  }

  // Also support secret query parameter for quick administrative manual triggers
  const querySecret = req.nextUrl.searchParams.get('secret');
  if (querySecret && querySecret === cronSecret) {
    return true;
  }

  return false;
}
