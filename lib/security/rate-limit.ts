import { Ratelimit } from '@upstash/ratelimit';
import { isUpstashConfigured, getRedisClient } from '@/lib/redis';

export { isUpstashConfigured };

/* ================================================================
   UPSTASH REDIS RATE LIMITER WITH RESILIENT IN-MEMORY FALLBACK
   Fixes A-4: Eliminates cold-start bypass on serverless lambdas.
================================================================ */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const MAX_IN_MEMORY_ENTRIES = 5000;
const inMemoryMap = new Map<string, RateLimitRecord>();

/**
 * Sweep expired rate limit entries from in-memory Map
 */
function sweepExpiredEntries(now = Date.now()): void {
  for (const [key, record] of inMemoryMap.entries()) {
    if (now > record.resetTime) {
      inMemoryMap.delete(key);
    }
  }
}

// Background sweep every 5 minutes (unref prevents blocking process termination)
if (typeof setInterval !== 'undefined') {
  const sweepInterval = setInterval(() => {
    sweepExpiredEntries();
  }, 5 * 60 * 1000);
  if (typeof sweepInterval.unref === 'function') {
    sweepInterval.unref();
  }
}

const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;
  const key = `${limit}:${windowMs}`;
  let limiter = upstashLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
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

  // Enforce bounded cache size: evict expired entries or trim oldest 10% if overflowing
  if (inMemoryMap.size >= MAX_IN_MEMORY_ENTRIES) {
    sweepExpiredEntries(now);
    if (inMemoryMap.size >= MAX_IN_MEMORY_ENTRIES) {
      let toRemove = Math.floor(MAX_IN_MEMORY_ENTRIES * 0.1);
      for (const key of inMemoryMap.keys()) {
        if (toRemove <= 0) break;
        inMemoryMap.delete(key);
        toRemove--;
      }
    }
  }

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
  if (isUpstashConfigured) {
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
