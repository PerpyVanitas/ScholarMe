import { handleApiError } from "@/lib/utils/api-error";
/** POST /api/sessions -- book a new tutoring session (learner_id = current user). */
import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if booking is suspended
  const { data: profile } = await supabase
    .from("profiles")
    .select("booking_suspended_until")
    .eq("id", user.id)
    .single();

  if (
    profile?.booking_suspended_until &&
    new Date(profile.booking_suspended_until) > new Date()
  ) {
    return NextResponse.json(
      {
        error: `Booking privileges suspended until ${new Date(profile.booking_suspended_until).toLocaleDateString()}`,
      },
      { status: 403 },
    );
  }

  const body = await request.json();
  const {
    tutor_id,
    scheduled_date,
    start_time,
    end_time,
    specialization_id,
    notes,
    prep_notes,
    is_recurring,
    max_participants,
    is_office_hours,
    tutor_notes,
    status,
  } = body;

  if (!tutor_id || !scheduled_date || !start_time || !end_time) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  // Check for overlapping sessions for this learner
  const { data: overlappingSessions } = await supabase
    .from("sessions")
    .select("id")
    .eq("learner_id", user.id)
    .eq("scheduled_date", scheduled_date)
    .neq("status", "cancelled")
    .neq("status", "no_show")
    .or(`and(start_time.lt.${end_time},end_time.gt.${start_time})`);

  if (overlappingSessions && overlappingSessions.length > 0) {
    return NextResponse.json(
      { error: "You already have a session booked during this time." },
      { status: 400 },
    );
  }

  // Check for overlapping sessions for this tutor
  const { data: tutorOverlaps } = await supabase
    .from("sessions")
    .select("id")
    .eq("tutor_id", tutor_id)
    .eq("scheduled_date", scheduled_date)
    .neq("status", "cancelled")
    .neq("status", "no_show")
    .or(`and(start_time.lt.${end_time},end_time.gt.${start_time})`);

  if (tutorOverlaps && tutorOverlaps.length > 0) {
    return NextResponse.json(
      { error: "The tutor is already booked during this time." },
      { status: 400 },
    );
  }

  // Check auto-approve logic
  let initialStatus = "pending";
  const { data: tutorData } = await supabase
    .from("tutors")
    .select("auto_approve_past_learners")
    .eq("id", tutor_id)
    .single();

  if (tutorData?.auto_approve_past_learners) {
    const { data: pastSessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("tutor_id", tutor_id)
      .eq("learner_id", user.id)
      .eq("status", "completed")
      .limit(1);

    if (pastSessions && pastSessions.length > 0) {
      initialStatus = "confirmed";
    }
  }

  // If tutor is creating the session themselves
  const { data: currentTutor } = await supabase
    .from("tutors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (currentTutor && currentTutor.id === tutor_id && status) {
    initialStatus = status;
  }

  const participantCap = Math.min(
    Math.max(Number(max_participants) || 1, 1),
    10,
  );

  // Handle recurring logic (e.g., next 4 weeks)
  const numWeeks = is_recurring ? 4 : 1;
  const recurring_id = is_recurring ? crypto.randomUUID() : null;

  const sessionsToInsert = [];
  const baseDate = new Date(scheduled_date);

  for (let i = 0; i < numWeeks; i++) {
    const currentSessionDate = new Date(baseDate);
    currentSessionDate.setDate(currentSessionDate.getDate() + i * 7);

    sessionsToInsert.push({
      tutor_id,
      learner_id: user.id,
      scheduled_date: currentSessionDate.toISOString().split("T")[0],
      start_time,
      end_time,
      status: initialStatus,
      specialization_id: specialization_id || null,
      notes: notes || null,
      prep_notes: prep_notes || null,
      recurring_id: recurring_id,
      max_participants: participantCap,
      is_office_hours: is_office_hours || false,
      tutor_notes: tutor_notes || null,
    });
  }

  const { data: sessions, error } = await supabase
    .from("sessions")
    .insert(sessionsToInsert)
    .select();

  if (error) {
    return handleApiError(error);
  }

  // Insert into session_participants for all created sessions
  if (sessions && sessions.length > 0) {
    const participantsToInsert = sessions.map((session) => ({
      session_id: session.id,
      learner_id: user.id,
      status: "registered",
    }));

    const { error: participantsError } = await supabase
      .from("session_participants")
      .insert(participantsToInsert);

    if (participantsError) {
      console.error("Failed to insert participants:", participantsError);
    }
  }

  return NextResponse.json(is_recurring ? sessions : sessions[0], {
    status: 201,
  });
}

