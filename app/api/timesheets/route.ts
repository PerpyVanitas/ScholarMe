import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/create-client";
import { ensureTutorRow } from "@/lib/tutors/db";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("timesheets")
    .select("*")
    .eq("user_id", user.id)
    .order("clock_in", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { action } = await req.json();

  const ensured = await ensureTutorRow(supabase, user);
  if (!ensured.ok) {
    return NextResponse.json({ error: ensured.error }, { status: 500 });
  }
  const tutor = { id: ensured.tutor.id };

  if (action === "clock_in") {
    // Check for an open entry (no clock_out)
    const { data: open } = await supabase
      .from("timesheets")
      .select("id")
      .eq("user_id", user.id)
      .is("clock_out", null)
      .maybeSingle();

    if (open) return NextResponse.json({ error: "Already clocked in" }, { status: 400 });

    // Use server-side NOW() for accurate timestamp
    const { data, error } = await supabase
      .from("timesheets")
      .insert({ 
        tutor_id: tutor.id, 
        user_id: user.id,
        clock_in: new Date().toISOString()
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

    // Use server-side NOW() for accurate timestamp
    const { data, error } = await supabase
      .from("timesheets")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", open.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
