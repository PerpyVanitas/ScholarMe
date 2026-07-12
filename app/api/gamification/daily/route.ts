import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function processDailyDecay(supabase: any, userId: string) {
  // Fetch the most recent login only (index 0 = most recent in descending order)
  const { data: logins } = await supabase
    .from("login_history")
    .select("login_at")
    .eq("user_id", userId)
    .order("login_at", { ascending: false })
    .limit(1);

  if (logins && logins.length >= 1) {
    const lastLogin = new Date(logins[0].login_at).getTime();
    const now = Date.now();
    const diffDays = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));

    // Only penalize if MORE than 1 day has passed (grace period for daily users)
    if (diffDays > 1) {
      // Penalize 50 XP per day missed, capped at 500 total
      const penalty = Math.min(diffDays * 50, 500);

      const { error: xpError } = await supabase.from("xp_logs").insert({
        profile_id: userId,
        amount: -penalty,
        reason: `XP Decay: Inactive for ${diffDays} days`,
      });

      if (xpError) {
        console.error("[Daily] Failed to insert XP decay log:", xpError);
      }

      return { success: true, penalty_applied: penalty, inactive_days: diffDays };
    }
  }

  return { success: true, penalty_applied: 0 };
}

export async function POST(_req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processDailyDecay(supabase, user.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[gamification/daily] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
