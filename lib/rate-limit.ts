/**
 * In-memory sliding window rate limiter.
 *
 * Usage:
 *   const limiter = rateLimit({ interval: 15 * 60 * 1000, limit: 5 });
 *   const result = await limiter.check(identifier);
 *   if (!result.success) return 429;
 */

interface RateLimitOptions {
  /** Window size in milliseconds */
  interval: number;
  /** Max requests per window */
  limit: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // Unix ms timestamp when window resets
}

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

export function rateLimit({ interval, limit }: RateLimitOptions) {
  return {
    check(identifier: string): RateLimitResult {
      const now = Date.now();
      const windowStart = now - interval;

      const entry = store.get(identifier) ?? { timestamps: [] };

      // Remove timestamps outside the current window
      entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

      const remaining = Math.max(0, limit - entry.timestamps.length);
      const success = entry.timestamps.length < limit;

      if (success) {
        entry.timestamps.push(now);
        store.set(identifier, entry);
      }

      const reset = entry.timestamps.length > 0
        ? entry.timestamps[0] + interval
        : now + interval;

      return { success, remaining: success ? remaining - 1 : 0, reset };
    },
  };
}
