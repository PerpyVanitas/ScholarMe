"use server";

import { createAdminClient } from "@/lib/supabase/server";

/**
 * Gets the last active date of a user using their login history.
 * Uses the admin client to bypass RLS policies that restrict viewing other users' login history.
 */
export async function getTutorLastActive(
  userId: string,
): Promise<string | null> {
  try {
    const supabaseAdmin = await createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("login_history")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching tutor last active:", error);
      return null;
    }

    return data?.created_at || null;
  } catch (err) {
    console.error("Failed to get tutor last active:", err);
    return null;
  }
}
