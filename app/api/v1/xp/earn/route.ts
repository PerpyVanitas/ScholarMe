import { z } from "zod";
import { handleApiError } from "@/lib/utils/api-error";
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

    const BodySchema = z.object({
      action: z.string(),
      reason: z.string().min(1, "Reason is required"),
    });

    const parseResult = BodySchema.safeParse(await req.json());

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { action, reason } = parseResult.data;

    if (!XP_AWARDS[action as keyof typeof XP_AWARDS]) {
      return NextResponse.json({ error: "Invalid or missing action" }, { status: 400 });
    }
    const amount = XP_AWARDS[action as keyof typeof XP_AWARDS];

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
      return handleApiError(error);
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
    return handleApiError(message);
  }
}
