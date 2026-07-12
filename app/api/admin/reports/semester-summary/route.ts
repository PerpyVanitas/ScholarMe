import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FINANCE_VIEW_ROLES, hasAnyRole } from "@/lib/utils/roles";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();
  const roleName = Array.isArray(profile?.roles)
    ? profile.roles[0]?.name
    : (profile?.roles as { name: string } | undefined)?.name;
  if (!hasAnyRole(roleName as string, FINANCE_VIEW_ROLES)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const semesterId = url.searchParams.get("semester_id");

  try {
    // Get all completed sessions (with optional semester date range filter)
    let sessionQuery = supabase
      .from("sessions")
      .select(
        "id, tutor_id, learner_id, scheduled_date, start_time, end_time, status, tutors(profiles(full_name)), specializations(name)",
      )
      .eq("status", "completed");

    if (semesterId) {
      // Optionally filter by period date range
      const { data: period } = await supabase
        .from("timesheet_periods")
        .select("start_date, end_date")
        .eq("id", semesterId)
        .single();
      if (period) {
        sessionQuery = sessionQuery
          .gte("scheduled_date", period.start_date)
          .lte("scheduled_date", period.end_date);
      }
    }

    const { data: sessions } = await sessionQuery;
    const safeS = sessions ?? [];

    // Top tutors by session count
    const tutorCounts = new Map<
      string,
      { name: string; count: number; totalMins: number }
    >();
    for (const s of safeS) {
      const tid = s.tutor_id;
      const name =
        (s.tutors as { profiles?: { full_name?: string } } | null)?.profiles
          ?.full_name ?? "Unknown";
      const existing = tutorCounts.get(tid);
      const startParts = s.start_time?.split(":").map(Number) ?? [0, 0];
      const endParts = s.end_time?.split(":").map(Number) ?? [0, 0];
      const mins =
        endParts[0] * 60 + endParts[1] - (startParts[0] * 60 + startParts[1]);
      if (existing) {
        existing.count += 1;
        existing.totalMins += Math.max(0, mins);
      } else {
        tutorCounts.set(tid, { name, count: 1, totalMins: Math.max(0, mins) });
      }
    }

    const uniqueLearners = new Set(safeS.map((s) => s.learner_id)).size;
    const topTutors = Array.from(tutorCounts.entries())
      .map(([id, v]) => ({ tutor_id: id, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalSessions = safeS.length;
    const totalHours =
      Array.from(tutorCounts.values()).reduce(
        (sum, v) => sum + v.totalMins,
        0,
      ) / 60;

    return NextResponse.json({
      totalSessions,
      totalHours: Math.round(totalHours * 10) / 10,
      uniqueLearners,
      topTutors,
    });
  } catch (error) {
    console.error("Semester summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
