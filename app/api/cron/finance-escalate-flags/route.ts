import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Cron route to auto-escalate Yellow Flags > 48 hours old to Orange Flags (Policy Section XII).
 * Should be scheduled to run periodically (e.g., hourly).
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check optional CRON_SECRET authorization header if configured
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized cron call" }, { status: 401 });
    }

    const cutOffTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Find all active Yellow flags created > 48 hours ago
    const { data: expiredYellowFlags, error: fetchError } = await supabase
      .from("finance_compliance_flags")
      .select("id, officer_id, reason")
      .eq("flag_level", "yellow")
      .eq("status", "active")
      .lt("date_issued", cutOffTime);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!expiredYellowFlags || expiredYellowFlags.length === 0) {
      return NextResponse.json({ message: "No Yellow flags requiring escalation", escalatedCount: 0 });
    }

    const flagIds = expiredYellowFlags.map((f) => f.id);

    // Auto-escalate to Orange flag level
    const { error: updateError } = await supabase
      .from("finance_compliance_flags")
      .update({
        flag_level: "orange",
        reason: "[AUTO-ESCALATED: 48h uncorrected window expired]",
      })
      .in("id", flagIds);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `Successfully escalated ${flagIds.length} Yellow flags to Orange`,
      escalatedCount: flagIds.length,
      flagIds,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
