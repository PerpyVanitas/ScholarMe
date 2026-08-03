import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRpc = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ rpc: mockRpc })),
}));

import { rateLimit } from "../rate-limit";

describe("rateLimit", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("fails open (allows requests with error flag) when Supabase env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const limiter = rateLimit({ interval: 60_000, limit: 5 });
    const result = await limiter.check("user-1");

    expect(result.success).toBe(true);
    expect(result.error).toBe(true);
    expect(result.remaining).toBe(5);
    expect(mockRpc).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("fails open (allows requests with error flag) when RPC returns an error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "rpc failed" } });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const limiter = rateLimit({ interval: 60_000, limit: 5 });
    const result = await limiter.check("user-1");

    expect(result.success).toBe(true);
    expect(result.error).toBe(true);
    expect(result.remaining).toBe(5);
    consoleSpy.mockRestore();
  });

  it("fails open (allows requests with error flag) when RPC returns empty data", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const limiter = rateLimit({ interval: 60_000, limit: 5 });
    const result = await limiter.check("user-1");

    expect(result.success).toBe(true);
    expect(result.error).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it("returns success when within rate limit", async () => {
    mockRpc.mockResolvedValue({
      data: [{ success: true, remaining: 4, reset: 1_700_000_000_000 }],
      error: null,
    });

    const limiter = rateLimit({ interval: 60_000, limit: 5 });
    const result = await limiter.check("user-1");

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.reset).toBe(1_700_000_000_000);
    expect(mockRpc).toHaveBeenCalledWith("increment_rate_limit", {
      p_identifier: "user-1",
      p_interval: 60_000,
      p_limit: 5,
    });
  });

  it("returns failure when rate limit exceeded", async () => {
    mockRpc.mockResolvedValue({
      data: [{ success: false, remaining: 0, reset: 1_700_000_000_000 }],
      error: null,
    });

    const limiter = rateLimit({ interval: 15 * 60 * 1000, limit: 5 });
    const result = await limiter.check("ip-192.168.1.1");

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
