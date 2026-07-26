import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { processDailyDecay } from "../daily-decay";

function createMockSupabase(loginAt: string | null, xpInsertError: unknown = null) {
  const insert = vi.fn().mockResolvedValue({ error: xpInsertError });
  const from = vi.fn((table: string) => {
    if (table === "login_history") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: loginAt ? [{ login_at: loginAt }] : [],
        }),
      };
    }
    if (table === "xp_logs") {
      return { insert };
    }
    return {};
  });

  return { from, insert };
}

describe("processDailyDecay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns zero penalty when user has no login history", async () => {
    const supabase = createMockSupabase(null);

    const result = await processDailyDecay(supabase, "user-1");

    expect(result).toEqual({ success: true, penalty_applied: 0 });
    expect(supabase.insert).not.toHaveBeenCalled();
  });

  it("returns zero penalty when user logged in within grace period (1 day)", async () => {
    const supabase = createMockSupabase("2026-07-25T12:00:00Z");

    const result = await processDailyDecay(supabase, "user-1");

    expect(result).toEqual({ success: true, penalty_applied: 0 });
    expect(supabase.insert).not.toHaveBeenCalled();
  });

  it("applies XP decay when inactive for more than 1 day", async () => {
    const supabase = createMockSupabase("2026-07-20T12:00:00Z");

    const result = await processDailyDecay(supabase, "user-1");

    expect(result).toEqual({
      success: true,
      penalty_applied: 300,
      inactive_days: 6,
    });
    expect(supabase.insert).toHaveBeenCalledWith({
      profile_id: "user-1",
      amount: -300,
      reason: "XP Decay: Inactive for 6 days",
    });
  });

  it("caps penalty at 500 XP for long inactivity", async () => {
    const supabase = createMockSupabase("2025-01-01T12:00:00Z");

    const result = await processDailyDecay(supabase, "user-1");

    expect(result.penalty_applied).toBe(500);
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ amount: -500 }),
    );
  });

  it("still succeeds when XP log insert fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const supabase = createMockSupabase("2026-07-10T12:00:00Z", {
      message: "insert failed",
    });

    const result = await processDailyDecay(supabase, "user-1");

    expect(result.success).toBe(true);
    expect(result.penalty_applied).toBeGreaterThan(0);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
