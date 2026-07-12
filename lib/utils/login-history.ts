import type { SupabaseClient } from "@supabase/supabase-js";
import { processDailyDecay } from "@/lib/gamification/daily-decay";

export async function recordLoginHistory(
  supabase: SupabaseClient,
  userId: string,
  meta?: { ip_address?: string; user_agent?: string },
) {
  try {
    // Process any XP decay before recording the new login, so we calculate based on the PREVIOUS login
    await processDailyDecay(supabase, userId);

    await supabase.from("login_history").insert({
      user_id: userId,
      ip_address: meta?.ip_address ?? null,
      user_agent: meta?.user_agent ?? null,
    });
  } catch (error) {
    console.error("Failed to record login history:", error);
  }
}
