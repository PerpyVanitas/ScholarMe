/** PUT /api/sessions/[id]/status -- update session status (confirm, complete, cancel). */
import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    status,
    meeting_link,
    start_time,
    end_time,
    scheduled_date,
    substitute_tutor_id,
  } = await request.json();

  if (
    status &&
    !["confirmed", "completed", "cancelled", "no_show"].includes(status)
  ) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: unknown = {};
  if (status) updateData.status = status;
  if (meeting_link !== undefined) updateData.meeting_link = meeting_link;
  if (start_time) updateData.start_time = start_time;
  if (end_time) updateData.end_time = end_time;
  if (scheduled_date) updateData.scheduled_date = scheduled_date;
  if (substitute_tutor_id) updateData.substitute_tutor_id = substitute_tutor_id;

  const { data, error } = await supabase
    .from("sessions")
    .update(updateData)
    .eq("id", id)
    .select("*, tutors(user_id)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Automate XP when completed
  if (status === "completed" && data) {
    const xpAwards = [];

    // For Learner
    if (data.learner_id) {
      xpAwards.push({
        profile_id: data.learner_id,
        amount: 50, // SESSION_COMPLETED
        reason: "Completed a tutoring session",
      });
    }

    // For Tutor
    const tutorData = Array.isArray(data.tutors) ? data.tutors[0] : data.tutors;
    if (tutorData?.user_id) {
      xpAwards.push({
        profile_id: tutorData.user_id,
        amount: 50,
        reason: "Taught a tutoring session",
      });
    }

    if (xpAwards.length > 0) {
      // Create a background task / execute insert silently without failing the overall route
      const { error: xpError } = await supabase
        .from("xp_logs")
        .insert(xpAwards);
      if (xpError) console.error(xpError);
    }
  }

  if (status === "no_show" && data?.tutor_id) {
    const { data: tutorRow } = await supabase
      .from("tutors")
      .select("strikes")
      .eq("id", data.tutor_id)
      .single();

    if (tutorRow) {
      await supabase
        .from("tutors")
        .update({ strikes: (tutorRow.strikes ?? 0) + 1 })
        .eq("id", data.tutor_id);
    }
  }

  return NextResponse.json(data);
}
