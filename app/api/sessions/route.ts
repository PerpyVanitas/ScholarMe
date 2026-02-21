/** POST /api/sessions -- book a new tutoring session (learner_id = current user). */
import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tutor_id, scheduled_date, start_time, end_time, specialization_id, notes } = body;

  if (!tutor_id || !scheduled_date || !start_time || !end_time) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      tutor_id,
      learner_id: user.id,
      scheduled_date,
      start_time,
      end_time,
      specialization_id: specialization_id || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(session, { status: 201 });
}
