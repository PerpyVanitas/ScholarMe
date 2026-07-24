import { NextResponse } from "next/server";
import { createClient as createBareAdminClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  return createBareAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: Request) {
  // Simple cron secret verification to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminSupabase();

  try {
    // We want to auto clock out tutors who haven't clocked out.
    // If this cron runs at 10 PM daily, it closes all open shifts.

    // Find all timesheets that do not have a clock_out
    const { data: openTimesheets, error } = await supabase
      .from("timesheets")
      .select("id, clock_in, last_confirmed_at")
      .is("clock_out", null);

    if (error) {
      throw error;
    }

    if (!openTimesheets || openTimesheets.length === 0) {
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        message: "No open timesheets to auto-clock out.",
      });
    }

    const nowMs = Date.now();
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const closedIds: string[] = [];

    for (const ts of openTimesheets) {
      const lastConfirmed = ts.last_confirmed_at || ts.clock_in;
      const lastConfirmedMs = new Date(lastConfirmed).getTime();

      // If inactive for 2 hours or more without confirmation, auto clock out at 2-hour mark
      if (nowMs - lastConfirmedMs >= TWO_HOURS_MS) {
        const autoClockOutTime = new Date(
          lastConfirmedMs + TWO_HOURS_MS,
        ).toISOString();
        const { error: updateError } = await supabase
          .from("timesheets")
          .update({ clock_out: autoClockOutTime })
          .eq("id", ts.id);

        if (!updateError) {
          closedIds.push(ts.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: closedIds.length,
      closedIds,
    });
  } catch (error: unknown) {
    console.error(
      "[CRON] Auto-clock out timesheets failed:",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
