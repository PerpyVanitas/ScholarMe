import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/create-client";
import { ensureTutorRow } from "@/lib/tutors/db";

// Helper to fetch active timesheet collection period
async function getActivePeriod(supabase: any) {
  try {
    const { data } = await supabase
      .from("timesheet_config")
      .select("start_date, end_date")
      .eq("id", 1)
      .maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const config = await getActivePeriod(supabase);
  if (!config || !config.start_date || !config.end_date) {
    // If admin has not set, timesheets are unavailable for tutors
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("timesheets")
    .select("*")
    .eq("user_id", user.id)
    .gte("clock_in", config.start_date)
    .lte("clock_in", config.end_date)
    .order("clock_in", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const config = await getActivePeriod(supabase);
  if (!config || !config.start_date || !config.end_date) {
    return NextResponse.json(
      { error: "The administrator has not set a timesheet collection duration yet." },
      { status: 400 }
    );
  }

  const { action } = await req.json();

  const ensured = await ensureTutorRow(supabase, user);
  if (!ensured.ok) {
    return NextResponse.json({ error: ensured.error }, { status: 500 });
  }
  const tutor = { id: ensured.tutor.id };

  const now = new Date();
  const nowTime = now.getTime();
  const startTime = new Date(config.start_date).getTime();
  const endTime = new Date(config.end_date).getTime();

  if (action === "clock_in") {
    // Verify current time is within boundaries
    if (nowTime < startTime || nowTime > endTime) {
      return NextResponse.json(
        { error: "Current date is outside the active timesheet collection period." },
        { status: 400 }
      );
    }

    // Check for an open entry (no clock_out)
    const { data: open } = await supabase
      .from("timesheets")
      .select("id")
      .eq("user_id", user.id)
      .is("clock_out", null)
      .maybeSingle();

    if (open) return NextResponse.json({ error: "Already clocked in" }, { status: 400 });

    const { data, error } = await supabase
      .from("timesheets")
      .insert({ 
        tutor_id: tutor.id, 
        user_id: user.id,
        clock_in: now.toISOString()
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (action === "clock_out") {
    const { data: open } = await supabase
      .from("timesheets")
      .select("*")
      .eq("user_id", user.id)
      .is("clock_out", null)
      .maybeSingle();

    if (!open) return NextResponse.json({ error: "Not clocked in" }, { status: 400 });

    const { data, error } = await supabase
      .from("timesheets")
      .update({ clock_out: now.toISOString() })
      .eq("id", open.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
