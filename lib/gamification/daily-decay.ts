// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      return {
        success: true,
        penalty_applied: penalty,
        inactive_days: diffDays,
      };
    }
  }

  return { success: true, penalty_applied: 0 };
}
