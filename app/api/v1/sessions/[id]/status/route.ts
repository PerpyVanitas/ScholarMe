import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/utils/api-error";
import { z } from "zod"; // Added Zod import

const updateSessionSchema = z.object({
  status: z.enum(["confirmed", "completed", "cancelled", "no_show"]).optional(),
  meeting_link: z.string().url().or(z.literal("")).nullable().optional(), // Can be a URL, empty string, or null, or omitted
  start_time: z.string().datetime({ offset: true }).optional(), // Must be ISO date string if present, otherwise omitted
  end_time: z.string().datetime({ offset: true }).optional(), // Must be ISO date string if present, otherwise omitted
  scheduled_date: z.string().datetime({ offset: true }).optional(), // Must be ISO date string if present, otherwise omitted
  transfer_to_tutor_id: z.string().uuid().nullable().optional(), // Must be a UUID or null if present, otherwise omitted
  tutor_id: z.string().uuid().optional(), // Must be a UUID if present, otherwise omitted
});

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

  const body = await request.json();
  const parsedBody = updateSessionSchema.safeParse(body);

  if (!parsedBody.success) {
    // console.error(parsedBody.error); // Uncomment for debugging Zod errors
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const {
    status,
    meeting_link,
    start_time,
    end_time,
    scheduled_date,
    transfer_to_tutor_id,
    tutor_id,
  } = parsedBody.data;

  // The original status validation is now handled by the Zod schema.
  // if (
  //   status &&
  //   !["confirmed", "completed", "cancelled", "no_show"].includes(status)
  // ) {
  //   return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  // }

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (meeting_link !== undefined) updateData.meeting_link = meeting_link;
  if (start_time) updateData.start_time = start_time;
  if (end_time) updateData.end_time = end_time;
  if (scheduled_date) updateData.scheduled_date = scheduled_date;
  if (transfer_to_tutor_id !== undefined) updateData.transfer_to_tutor_id = transfer_to_tutor_id;
  if (tutor_id) updateData.tutor_id = tutor_id;

  const { data, error } = await supabase
    .from("sessions")
    .update(updateData)
    .eq("id", id)
    .select("*, tutors(user_id)")
    .single();

  if (error) {
    return handleApiError(error);
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
