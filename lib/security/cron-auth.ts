import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Verify that an incoming request to a scheduled cron route is authorized.
 * Vercel automatically passes `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
 *
 * In production:
 * - Requires a matching Bearer token or x-cron-secret header against process.env.CRON_SECRET.
 * - Enforces constant-time cryptographic equality comparison (prevents timing attacks).
 * - Prohibits secret exposure in URL query parameters to avoid logging in proxies/CDN logs.
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

  const expectedBuffer = Buffer.from(cronSecret);

  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const tokenBuffer = Buffer.from(token);
    if (
      tokenBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(tokenBuffer, expectedBuffer)
    ) {
      return true;
    }
  }

  // 2. Custom header: x-cron-secret
  const customHeader = req.headers.get('x-cron-secret');
  if (customHeader) {
    const customBuffer = Buffer.from(customHeader.trim());
    if (
      customBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(customBuffer, expectedBuffer)
    ) {
      return true;
    }
  }

  return false;
}

