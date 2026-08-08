import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateDailyStreakXp, calculateLevel } from "@/lib/utils/gamification";
import { tryUnlockBadge } from "@/lib/utils/badges";

export interface DailyCheckinResult {
  success: boolean;
  claimed_today: boolean;
  is_first_claim_today: boolean;
  streak: number;
  xp_earned: number;
  total_xp?: number;
  current_level?: number;
  error?: string;
}

/**
 * Handles daily login check-in, streak calculation, and daily XP reward awarding.
 * - Base award: 50 XP (Day 1)
 * - Streak bonus: scales up to Day 30 (100 XP) and caps at Day 30 (Day 31+ stays 100 XP).
 * - Idempotent: safe to call on every page load; only awards XP once per calendar day.
 */
export async function processDailyCheckin(
  supabase: unknown,
  userId: string,
): Promise<DailyCheckinResult> {
  try {
    const client = supabase as SupabaseClient;

    // Fetch user streak data
    const { data: streakRecord, error: streakFetchError } = await client
      .from("user_streaks")
      .select("current_streak, last_login_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (streakFetchError) {
      console.error("[DailyCheckin] Error fetching user_streaks:", streakFetchError.message);
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

    if (streakRecord && streakRecord.last_login_date) {
      const lastLoginDate = new Date(streakRecord.last_login_date);
      const lastLoginStr = lastLoginDate.toISOString().split("T")[0];

      // Check if already claimed today
      if (lastLoginStr === todayStr) {
        return {
          success: true,
          claimed_today: true,
          is_first_claim_today: false,
          streak: streakRecord.current_streak || 1,
          xp_earned: 0,
        };
      }
    }

    // Determine new streak count
    let newStreak = 1;
    if (streakRecord && streakRecord.last_login_date) {
      const lastLoginDate = new Date(streakRecord.last_login_date);

      // Truncate to UTC midnight to count calendar days accurately
      const lastUtc = Date.UTC(
        lastLoginDate.getUTCFullYear(),
        lastLoginDate.getUTCMonth(),
        lastLoginDate.getUTCDate(),
      );
      const nowUtc = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
      );

      const diffDays = Math.floor((nowUtc - lastUtc) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive daily login
        newStreak = (streakRecord.current_streak || 0) + 1;
      } else {
        // Inactive > 1 day, streak resets to 1
        newStreak = 1;
      }
    }

    // Calculate XP award using streak formula (base 50, capped at day 30 = 100 XP)
    const xpAwarded = calculateDailyStreakXp(newStreak);

    // Upsert user_streaks record
    const { error: upsertError } = await client
      .from("user_streaks")
      .upsert(
        {
          user_id: userId,
          current_streak: newStreak,
          last_login_date: now.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (upsertError) {
      console.error("[DailyCheckin] Failed to upsert user_streaks:", upsertError.message);
    }

    // Record XP log
    const { error: xpError } = await client.from("xp_logs").insert({
      profile_id: userId,
      amount: xpAwarded,
      reason: `Daily Login Streak (Day ${newStreak})`,
    });

    if (xpError) {
      console.error("[DailyCheckin] Failed to insert xp_log:", xpError.message);
    }

    // Synchronize profiles total_xp and current_level
    const { data: profile } = await client
      .from("profiles")
      .select("total_xp")
      .eq("id", userId)
      .maybeSingle();

    const currentXp = profile?.total_xp || 0;
    const newTotalXp = Math.max(0, currentXp + xpAwarded);
    const newLevel = calculateLevel(newTotalXp);

    await client
      .from("profiles")
      .update({ total_xp: newTotalXp, current_level: newLevel })
      .eq("id", userId);

    // Check week warrior badge requirement
    if (newStreak >= 7) {
      await tryUnlockBadge(client, userId, "week_warrior");
    }

    return {
      success: true,
      claimed_today: true,
      is_first_claim_today: true,
      streak: newStreak,
      xp_earned: xpAwarded,
      total_xp: newTotalXp,
      current_level: newLevel,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Daily check-in error";
    console.error("[DailyCheckin] Exception during daily check-in:", message);
    return {
      success: false,
      claimed_today: false,
      is_first_claim_today: false,
      streak: 1,
      xp_earned: 0,
      error: message,
    };
  }
}
