import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/utils/roles";

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
    : (profile?.roles as any)?.name;
  if (!isAdminRole(roleName as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const semesterId = url.searchParams.get("semester_id");

  try {
    let tsQuery = supabase
      .from("timesheets")
      .select(
        "tutor_id, clock_in, clock_out, tutors(profiles(full_name, avatar_url))",
      )
      .not("clock_out", "is", null);

    if (semesterId) {
      const { data: period } = await supabase
        .from("timesheet_periods")
        .select("start_date, end_date")
        .eq("id", semesterId)
        .single();
      if (period) {
        tsQuery = tsQuery
          .gte("clock_in", period.start_date)
          .lte("clock_in", period.end_date);
      }
    }

    const { data: timesheets } = await tsQuery;
    const safeTs = timesheets ?? [];

    const tutorMap = new Map<string, any>();
    for (const ts of safeTs) {
      const tid = ts.tutor_id;
      const existing = tutorMap.get(tid);
      const start = new Date(ts.clock_in).getTime();
      const end = new Date(ts.clock_out!).getTime();
      const mins = Math.max(0, (end - start) / 60000);

      if (existing) {
        existing.total_minutes += mins;
        existing.sessions_count += 1;
      } else {
        const profile = (ts.tutors as any)?.profiles;
        tutorMap.set(tid, {
          tutor_id: tid,
          full_name: profile?.full_name ?? "Unknown",
          avatar_url: profile?.avatar_url ?? null,
          total_minutes: mins,
          sessions_count: 1,
        });
      }
    }

    const REQUIRED_MINUTES = 40 * 60; // 40 hours standard requirement

    const complianceData = Array.from(tutorMap.values())
      .map((t) => {
        const is_compliant = t.total_minutes >= REQUIRED_MINUTES;
        const progress_percentage = Math.min(
          100,
          Math.round((t.total_minutes / REQUIRED_MINUTES) * 100),
        );
        return {
          ...t,
          is_compliant,
          progress_percentage,
        };
      })
      .sort((a, b) => b.total_minutes - a.total_minutes);

    return NextResponse.json(complianceData);
  } catch (error) {
    console.error("Tutor compliance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
