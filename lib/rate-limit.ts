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
        console.error("[RateLimit] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set — rate limiter blocking all requests.");
        return {
          success: false,
          remaining: 0,
          reset: Date.now() + interval,
        };
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const now = Date.now();
      const windowStart = now - interval;

      // Fetch existing entry
      const { data } = await supabase
        .from("ratelimit_windows")
        .select("timestamps")
        .eq("identifier", identifier)
        .single();

      let timestamps: number[] = data?.timestamps || [];

      // Remove timestamps outside the current window
      timestamps = timestamps.filter((t: number) => t > windowStart);

      const remaining = Math.max(0, limit - timestamps.length);
      const success = timestamps.length < limit;

      if (success) {
        timestamps.push(now);
      }

      // Upsert the updated timestamps
      await supabase
        .from("ratelimit_windows")
        .upsert({ identifier, timestamps }, { onConflict: "identifier" });

      const reset =
        timestamps.length > 0 ? timestamps[0] + interval : now + interval;

      return { success, remaining: success ? remaining - 1 : 0, reset };
    },
  };
}
