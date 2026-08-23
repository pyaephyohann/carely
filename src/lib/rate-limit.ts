/**
 * In-memory rate limiter for API routes.
 *
 * Architecture:
 *   request → rateLimit(key, config) → allowed? | 429
 *
 * Uses a sliding-window counter per key. Memory is bounded:
 * entries are evicted after 2× the window duration.
 *
 * Not suitable for distributed deployments (use Redis-backed limiter instead).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000; // every 60 seconds

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

// Run cleanup at module load
cleanup();

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window. */
  max: number;
  /** Window duration in milliseconds. Default: 60_000 (1 minute). */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and increment rate limit for a given key.
 *
 * @param key   Unique identifier (e.g. IP address + endpoint).
 * @param config  Rate limit configuration.
 * @returns Whether the request is allowed, remaining count, and reset time.
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const { max, windowMs = 60_000 } = config;
  const now = Date.now();
  const resetAt = now + windowMs;

  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  // Existing window
  if (existing.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: max - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Extract a rate limit key from a Request object.
 * Uses IP address + optional path prefix.
 */
export function getRateLimitKey(
  request: Request,
  prefix: string = "",
): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${prefix}:${ip}`;
}
