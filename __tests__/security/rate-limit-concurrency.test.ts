import { describe, it, expect } from "vitest";
import { hasTestDb, getTestClient, randomSuffix } from "./test-db";

describe.skipIf(!hasTestDb)("Rate Limiter Atomicity", () => {
  it("P1-2: 20 concurrent requests at limit 5 exactly 5 succeed", async () => {
    const supabase = getTestClient();
    const identifier = `concurrent-test-${randomSuffix()}`;
    const interval = 10000;
    const limit = 5;

    // Fire 20 requests concurrently
    const promises = Array.from({ length: 20 }).map(() =>
      supabase.rpc("increment_rate_limit", {
        p_identifier: identifier,
        p_interval: interval,
        p_limit: limit,
      }),
    );

    const results = await Promise.all(promises);

    // Filter successful requests
    const successes = results.filter(
      (r) => r.data && r.data[0] && r.data[0].success === true,
    );

    // Exactly 5 should succeed, no more, due to atomicity of Postgres RPC
    expect(successes.length).toBe(limit);
  });
});
