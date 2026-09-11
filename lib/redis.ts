import { Redis } from '@upstash/redis';

/* ================================================================
   UPSTASH REDIS CLIENT SINGLETON
   Centralized Redis client for distributed rate limiting & caching.
================================================================ */

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

let isTemporarilyDisabled = false;
let disabledUntil = 0;

export function markRedisUnreachable(cooldownMs = 60000): void {
  isTemporarilyDisabled = true;
  disabledUntil = Date.now() + cooldownMs;
}

export function isRedisAvailable(): boolean {
  if (!isUpstashConfigured) return false;
  if (isTemporarilyDisabled) {
    if (Date.now() < disabledUntil) return false;
    isTemporarilyDisabled = false;
  }
  return true;
}

let redisClient: Redis | null = null;

/**
 * Returns the shared Redis client instance if configured and available, or null otherwise.
 */
export function getRedisClient(): Redis | null {
  if (!isRedisAvailable()) return null;
  if (!redisClient) {
    try {
      redisClient = new Redis({
        url: upstashUrl,
        token: upstashToken,
      });
    } catch (err) {
      console.warn('[redis] Failed to initialize Upstash Redis client:', err);
      markRedisUnreachable(60000);
      return null;
    }
  }
  return redisClient;
}
