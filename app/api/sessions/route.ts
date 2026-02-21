/**
 * ==========================================================================
 * API: CREATE SESSION - POST /api/sessions
 * ==========================================================================
 *
 * PURPOSE: Creates a new tutoring session (booking). Called when a learner
 * books a session from the tutor detail page.
 *
 * Body: { tutor_id, scheduled_date, start_time, end_time, specialization_id?, notes? }
 * Returns: The created session record with status "pending"
 *
 * AUTH: Requires an authenticated user (the learner). The learner_id is
 * automatically set to the current user's ID.
 * ==========================================================================
 */
import { createClient } from "@/lib/supabase/server";
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
