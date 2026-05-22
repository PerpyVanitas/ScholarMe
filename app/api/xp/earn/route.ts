import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { XP_AWARDS } from "@/lib/utils/gamification";

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
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp, current_level")
      .eq("id", user.id)
      .single();

    return NextResponse.json({ 
      success: true, 
      xp_earned: amount,
      total_xp: profile?.total_xp,
      current_level: profile?.current_level
    });

  } catch (error: any) {
    console.error("Error earning XP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to earn XP" },
      { status: 500 }
    );
  }
}
