import { handleApiError } from "@/lib/utils/api-error";
/** POST /api/sessions -- book a new tutoring session (learner_id = current user). */
import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const bookingRateLimiter = rateLimit({ interval: 60 * 1000, limit: 10 });

// Define Zod schema for the request body
const postBookingSchema = z.object({
  tutor_id: z.string().uuid("Tutor ID must be a valid UUID"), // Assuming UUIDs for IDs
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format, expected HH:MM"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format, expected HH:MM"),
  specialization_id: z.string().uuid().optional().nullable(), // Assuming UUIDs for IDs
  notes: z.string().optional().nullable(),
  prep_notes: z.string().optional().nullable(),
  is_recurring: z.boolean().optional(),
  max_participants: z.number().int().min(1, "Max participants must be at least 1").optional(),
  is_office_hours: z.boolean().optional(),
  tutor_notes: z.string().optional().nullable(),
  status: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limitRes = await bookingRateLimiter.check(`booking:${user.id}:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many booking requests" },
      { status: 429 },
    );
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

  // Validate request body using Zod
  const bodyResult = postBookingSchema.safeParse(await request.json());

  if (!bodyResult.success) {
    // console.error("Zod validation error:", bodyResult.error.issues); // Uncomment for debugging
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

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
  } = bodyResult.data;

  // The original check `if (!tutor_id || !scheduled_date || !start_time || !end_time)`
  // is now redundant because Zod schema validates these fields as required.

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

  // max_participants is already validated as a number (if present).
  // Default to 1 if not provided, then cap at 10.
  const participantCap = Math.min(max_participants ?? 1, 10);

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
