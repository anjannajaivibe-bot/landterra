import { PaginatedResponse, IProperty } from "@/types/property";
import {
  getRedisClient,
  isRedisAvailable,
  markRedisUnreachable,
} from "@/lib/redis";

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export const hotPropertyCache = new Map<string, CacheEntry<PaginatedResponse<IProperty>>>();
export const CACHE_TTL_MS = 30000; // 30 seconds
export const REDIS_CACHE_TTL_SEC = 30;
export const REDIS_VERSION_KEY = 'bhoomimitra:props:ver';

/**
 * Local micro-cache of the Redis cache version to avoid extra roundtrips
 */
export let localCacheVersion = 1;
export let localCacheVersionExpiresAt = 0;

export function handleRedisCacheError(err: unknown, action: string): void {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('WRONGPASS') || msg.includes('disabled') || msg.includes('unauthorized')) {
    markRedisUnreachable(15 * 60 * 1000); // 15 minutes cooldown
    console.warn('[property-cache] Upstash Redis credentials invalid or disabled (WRONGPASS). Switched to fast in-memory cache.');
  } else {
    markRedisUnreachable(30 * 1000); // 30s cooldown
    console.warn(`[property-cache] Redis operation failed (${action}):`, msg.slice(0, 100));
  }
}

export async function getDistributedCacheVersion(): Promise<number> {
  const now = Date.now();
  if (now < localCacheVersionExpiresAt) {
    return localCacheVersion;
  }
  const redis = getRedisClient();
  if (!redis) return 1;
  try {
    const ver = await redis.get<number>(REDIS_VERSION_KEY);
    if (typeof ver === 'number' && ver > 0) {
      localCacheVersion = ver;
    } else if (ver !== null && !isNaN(Number(ver))) {
      localCacheVersion = Number(ver);
    } else {
      localCacheVersion = 1;
    }
    localCacheVersionExpiresAt = now + 5000; // Micro-cache version locally for 5 seconds
    return localCacheVersion;
  } catch (err) {
    handleRedisCacheError(err, 'retrieve cache version');
    return localCacheVersion;
  }
}

/**
 * Invalidates the hot query cache across both the local node and
 * distributed serverless instances by incrementing the Redis version key.
 */
export function invalidatePropertyCache(): void {
  // 1. Immediately invalidate local in-memory cache
  hotPropertyCache.clear();
  localCacheVersionExpiresAt = 0;

  // 2. Increment distributed Redis version key (O(1) multi-node invalidation)
  if (isRedisAvailable()) {
    const redis = getRedisClient();
    if (redis) {
      redis.incr(REDIS_VERSION_KEY).catch((err) => {
        handleRedisCacheError(err, 'increment cache version');
      });
    }
  }
}
