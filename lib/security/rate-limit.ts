import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/* ================================================================
   UPSTASH REDIS RATE LIMITER WITH RESILIENT IN-MEMORY FALLBACK
   Fixes A-4: Eliminates cold-start bypass on serverless lambdas.
================================================================ */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const inMemoryMap = new Map<string, RateLimitRecord>();

function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
}

const upstashUrl = cleanEnv(
  process.env.UPSTASH_REDIS_KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.STORAGE_REST_API_URL ||
  process.env.STORAGE_URL ||
  process.env.KV_REST_API_URL
);
const upstashToken = cleanEnv(
  process.env.UPSTASH_REDIS_KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.STORAGE_REST_API_TOKEN ||
  process.env.STORAGE_TOKEN ||
  process.env.KV_REST_API_TOKEN
);

export const isUpstashConfigured = Boolean(
  upstashUrl &&
  upstashToken &&
  !upstashUrl.includes('your-') &&
  !upstashToken.includes('your-')
);

let redisClient: Redis | null = null;
if (isUpstashConfigured) {
  try {
    redisClient = new Redis({
      url: upstashUrl,
      token: upstashToken,
    });
  } catch (err) {
    console.warn('[rate-limit] Failed to initialize Upstash Redis client, falling back to in-memory limiter:', err);
  }
}

const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redisClient) return null;
  const key = `${limit}:${windowMs}`;
  let limiter = upstashLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms` as any),
      prefix: 'bhoomimitra:ratelimit',
      analytics: false,
    });
    upstashLimiters.set(key, limiter);
  }
  return limiter;
}

function checkInMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = inMemoryMap.get(identifier);

  // Clean up expired records
  if (!record || now > record.resetTime) {
    inMemoryMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1) };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - record.count) };
}

/**
 * Check if an IP or identifier has exceeded the rate limit.
 * Uses Upstash Redis (sliding window) across serverless instances if configured.
 * Automatically falls back to in-memory rate limiting if Upstash Redis is not configured or unreachable.
 *
 * @param identifier Client IP, user ID, or composite key (e.g. `call-user:123`, `inquiry-ip:1.2.3.4`)
 * @param limit Max requests allowed per window (default: 60)
 * @param windowMs Window duration in milliseconds (default: 60000 = 1 minute)
 */
export async function checkRateLimit(
  identifier: string,
  limit = 60,
  windowMs = 60000
): Promise<{ allowed: boolean; remaining: number }> {
  if (isUpstashConfigured && redisClient) {
    try {
      const limiter = getUpstashLimiter(limit, windowMs);
      if (limiter) {
        const result = await limiter.limit(identifier);
        return {
          allowed: result.success,
          remaining: result.remaining,
        };
      }
    } catch (err) {
      console.warn('[rate-limit] Upstash Redis request failed, falling back to in-memory limiter:', err);
    }
  }

  return checkInMemoryRateLimit(identifier, limit, windowMs);
}

/**
 * Clean HTML / XSS sanitization for user string inputs
 */
export function sanitizeString(input?: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // strip dangerous tags
    .trim();
}
