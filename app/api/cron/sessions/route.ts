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
    // We want to complete sessions where the current time > end_time AND status is "scheduled"
    // Since scheduled_date is a Date string and end_time is a Time string (e.g. 14:00:00)
    // we need to query and process in memory, or use a complex Postgres query.
    // For simplicity and safety in an Edge runtime, we fetch all 'scheduled' sessions
    // from the past week up to today, and filter them locally.

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const dateLimit = oneWeekAgo.toISOString().split("T")[0];

    const { data: scheduledSessions, error } = await supabase
      .from("sessions")
      .select("id, scheduled_date, end_time, learner_id, tutors(user_id)")
      .eq("status", "scheduled")
      .gte("scheduled_date", dateLimit);

    if (error) {
      throw error;
    }

    if (!scheduledSessions || scheduledSessions.length === 0) {
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        message: "No sessions to update.",
      });
    }

    const now = new Date();
    const sessionsToUpdate = scheduledSessions.filter((session) => {
      // Create a Date object representing the session's end time
      // session.end_time is like "14:30:00"
      const sessionEnd = new Date(
        `${session.scheduled_date}T${session.end_time}`,
      );
      return now > sessionEnd;
    });

    if (sessionsToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        message: "No past sessions found.",
      });
    }

    const sessionIds = sessionsToUpdate.map((s) => s.id);

    // Update status to 'completed'
    const { error: updateError } = await supabase
      .from("sessions")
      .update({ status: "completed" })
      .in("id", sessionIds);

    if (updateError) {
      throw updateError;
    }

    // Award XP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xpAwards: any[] = [];
    sessionsToUpdate.forEach((session) => {
      if (session.learner_id) {
        xpAwards.push({
          profile_id: session.learner_id,
          amount: 50,
          reason: "Completed a tutoring session",
        });
      }
      const tutorData = Array.isArray(session.tutors)
        ? session.tutors[0]
        : session.tutors;
      if (tutorData?.user_id) {
        xpAwards.push({
          profile_id: tutorData.user_id,
          amount: 50,
          reason: "Taught a tutoring session",
        });
      }
    });

    if (xpAwards.length > 0) {
      const { error: xpError } = await supabase
        .from("xp_logs")
        .insert(xpAwards);
      if (xpError) console.error(xpError);
    }

    return NextResponse.json({
      success: true,
      updatedCount: sessionIds.length,
      sessionIds,
    });
  } catch (error: unknown) {
    console.error(
      "[CRON] Auto-complete sessions failed:",
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
