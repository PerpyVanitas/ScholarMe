import { describe, it, expect, vi } from "vitest";
import { processDailyCheckin } from "../daily-checkin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMockSupabase(streakData: any = null, profileData: any = { total_xp: 0 }) {
  const chain = {
    _currentTable: "",
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockImplementation(() => {
      if (chain._currentTable === "user_streaks") {
        return Promise.resolve({ data: streakData, error: null });
      }
      if (chain._currentTable === "profiles") {
        return Promise.resolve({ data: profileData, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnThis(),
  };

  return {
    from: vi.fn().mockImplementation((table: string) => {
      chain._currentTable = table;
      return chain;
    }),
  };
}

describe("processDailyCheckin", () => {
  it("awards 50 XP for new user's first daily check-in (Day 1)", async () => {
    const mockSupabase = createMockSupabase(null, { total_xp: 0 });
    const result = await processDailyCheckin(mockSupabase, "user-1");

    expect(result.success).toBe(true);
    expect(result.claimed_today).toBe(true);
    expect(result.is_first_claim_today).toBe(true);
    expect(result.streak).toBe(1);
    expect(result.xp_earned).toBe(50);
  });

  it("returns already claimed today if user checked in earlier today", async () => {
    const todayIso = new Date().toISOString();
    const mockSupabase = createMockSupabase({ current_streak: 5, last_login_date: todayIso });

    const result = await processDailyCheckin(mockSupabase, "user-1");

    expect(result.success).toBe(true);
    expect(result.claimed_today).toBe(true);
    expect(result.is_first_claim_today).toBe(false);
    expect(result.streak).toBe(5);
    expect(result.xp_earned).toBe(0);
  });

  it("increments streak and awards scaled XP for consecutive day login", async () => {
    const yesterdayDate = new Date();
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterday = yesterdayDate.toISOString();

    const mockSupabase = createMockSupabase(
      { current_streak: 14, last_login_date: yesterday },
      { total_xp: 500 },
    );

    const result = await processDailyCheckin(mockSupabase, "user-1");

    expect(result.success).toBe(true);
    expect(result.is_first_claim_today).toBe(true);
    expect(result.streak).toBe(15);
    expect(result.xp_earned).toBe(74); // Day 15 streak award
  });

  it("caps streak bonus at Day 30 (100 XP) even for Day 31+", async () => {
    const yesterdayDate = new Date();
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterday = yesterdayDate.toISOString();

    const mockSupabase = createMockSupabase(
      { current_streak: 30, last_login_date: yesterday },
      { total_xp: 2000 },
    );

    const result = await processDailyCheckin(mockSupabase, "user-1");

    expect(result.success).toBe(true);
    expect(result.streak).toBe(31);
    expect(result.xp_earned).toBe(100);
  });

  it("resets streak to 1 if user missed > 1 day", async () => {
    const threeDaysAgoDate = new Date();
    threeDaysAgoDate.setUTCDate(threeDaysAgoDate.getUTCDate() - 3);
    const threeDaysAgo = threeDaysAgoDate.toISOString();

    const mockSupabase = createMockSupabase(
      { current_streak: 20, last_login_date: threeDaysAgo },
      { total_xp: 1500 },
    );

    const result = await processDailyCheckin(mockSupabase, "user-1");

    expect(result.success).toBe(true);
    expect(result.streak).toBe(1);
    expect(result.xp_earned).toBe(50);
  });
});
