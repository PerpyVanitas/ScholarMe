/**
 * Supabase-backed sliding window rate limiter.
 * Protected from serverless cold starts.
 *
 * Usage:
 *   const limiter = rateLimit({ interval: 15 * 60 * 1000, limit: 5 });
 *   const result = await limiter.check(identifier);
 *   if (!result.success) return 429;
 */
import { createClient } from "@supabase/supabase-js";

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

export function rateLimit({ interval, limit }: RateLimitOptions) {
  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        // Fail closed: if env vars are missing, block requests rather than allow them
        // This prevents a misconfigured environment from bypassing rate limiting entirely
        console.error(
          "[RateLimit] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set — rate limiter blocking all requests.",
        );
        return {
          success: false,
          remaining: 0,
          reset: Date.now() + interval,
        };
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const now = Date.now();
      const windowStart = now - interval;

      const { data, error } = await supabase.rpc("increment_rate_limit", {
        p_identifier: identifier,
        p_interval: interval,
        p_limit: limit,
      });

      if (error || !data || data.length === 0) {
        console.error("[RateLimit] Error calling RPC:", error);
        // Fail closed on database error
        return {
          success: false,
          remaining: 0,
          reset: now + interval,
        };
      }

      const row = data[0];
      return {
        success: row.success,
        remaining: row.remaining,
        reset: Number(row.reset),
      };
    },
  };
}
