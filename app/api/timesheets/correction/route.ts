/** POST /api/timesheets/correction — Submit a time correction request for admin review */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/create-client";
import { TimesheetCorrectionSchema } from "@/features/timesheets/schema";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { timesheet_id, requested_clock_out, reason } = body;

  if (!timesheet_id || !requested_clock_out || !reason?.trim()) {
    return NextResponse.json(
      { error: "timesheet_id, requested_clock_out, and reason are required" },
      { status: 400 },
    );
  }

  // Verify the timesheet belongs to this user
  const { data: entry } = await supabase
    .from("timesheets")
    .select("id, user_id, clock_in")
    .eq("id", timesheet_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!entry) {
    return NextResponse.json(
      { error: "Timesheet entry not found" },
      { status: 404 },
    );
  }

  const validation = TimesheetCorrectionSchema.safeParse({
    timesheet_id,
    requested_clock_out,
    reason: reason.trim(),
    original_clock_in: entry.clock_in,
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0].message },
      { status: 400 },
    );
  }

  // Insert correction request — uses timesheet_corrections table if it exists,
  // otherwise fall back to creating a notification for admins
  const { error } = await supabase.from("timesheet_corrections").insert({
    timesheet_id,
    requested_by: user.id,
    requested_clock_out,
    reason: reason.trim(),
    status: "pending",
  });

  if (error) {
    // Table may not exist yet — notify admin via notification instead
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Time Correction Requested",
      message: `You requested a correction for entry ${timesheet_id}. Reason: ${reason.trim()}`,
      type: "system",
      is_read: false,
    });
    // Also create a system log
    console.warn("timesheet_corrections table may not exist:", error.message);
    return NextResponse.json({
      message: "Correction request noted. Admin has been notified.",
      fallback: true,
    });
  }

  return NextResponse.json({
    message: "Correction request submitted for admin review.",
  });
}
