import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { XP_AWARDS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, reason } = body;

    if (!action || !XP_AWARDS[action as keyof typeof XP_AWARDS]) {
      return NextResponse.json({ error: "Invalid or missing action" }, { status: 400 });
    }
    const amount = XP_AWARDS[action as keyof typeof XP_AWARDS];

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    // Insert into xp_logs
    const { data, error } = await supabase
      .from("xp_logs")
      .insert({
        profile_id: user.id,
        amount: amount,
        reason: reason
      })
      .select()
      .single();

    if (error) {
      console.error("Database error while inserting xp_log:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Since trigger_update_profile_level updates the profile automatically,
    // we just fetch the updated profile level/xp to return to the client.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("total_xp, current_level")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[XP] Failed to fetch updated profile after XP insert:", profileError.message);
      // Still return success — the XP was inserted, we just can't confirm the new total
      return NextResponse.json({ success: true, xp_earned: amount });
    }

    return NextResponse.json({ 
      success: true, 
      xp_earned: amount,
      total_xp: profile?.total_xp ?? 0,
      current_level: profile?.current_level ?? 1,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error earning XP:", message);
    return NextResponse.json(
      { error: message || "Failed to earn XP" },
      { status: 500 }
    );
  }
}
