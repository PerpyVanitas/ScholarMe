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
  error?: boolean; // true when rate limit check itself failed (infra error)
}

export function rateLimit({ interval, limit }: RateLimitOptions) {
  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        // Fail open for AI: if env vars are missing we can't check limits but shouldn't block users.
        // Log loudly so infra team notices.
        console.error(
          "[RateLimit] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set — rate limiter disabled.",
        );
        return {
          success: true,
          remaining: limit,
          reset: Date.now() + interval,
          error: true,
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
        // Fail open on RPC error: don't punish the user for our infra problems.
        // Mark error: true so callers can decide how to handle it.
        return {
          success: true,
          remaining: limit,
          reset: now + interval,
          error: true,
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
