// In-memory token bucket rate limiter for protection against brute force and scraping
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipMap = new Map<string, RateLimitRecord>();

/**
 * Check if an IP address has exceeded the rate limit
 * @param ip Client IP
 * @param limit Max requests per window
 * @param windowMs Window duration in milliseconds (default 1 minute)
 */
export function checkRateLimit(ip: string, limit = 60, windowMs = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = ipMap.get(ip);

  // Clean up expired records
  if (!record || now > record.resetTime) {
    ipMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count };
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
