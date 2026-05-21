import { createAdminClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const adminClient = await createAdminClient();

    // Verify user is authenticated
    const { data: { user } } = await adminClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is admin
    const { data: profile } = await adminClient
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();

    const roleName = Array.isArray(profile?.roles)
      ? profile.roles[0]?.name
      : (profile?.roles as any)?.name;
    const isAdmin = roleName === "admin" || roleName === "administrator";
    
    if (!profile || !isAdmin) {
      return NextResponse.json({ error: "Access denied - admin only" }, { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];

    const results = await Promise.allSettled([
      adminClient.from("sessions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      adminClient.from("timesheets").select("id", { count: "exact", head: true }).is("clock_out", null),
      adminClient.from("tutors").select("id", { count: "exact", head: true }),
      adminClient.from("sessions").select("id", { count: "exact", head: true }).eq("scheduled_date", today),
    ]);

    const pendingSessions = results[0].status === "fulfilled" ? results[0].value.count || 0 : 0;
    const clockedInTutors = results[1].status === "fulfilled" ? results[1].value.count || 0 : 0;
    const activeTutors = results[2].status === "fulfilled" ? results[2].value.count || 0 : 0;
    const sessionsToday = results[3].status === "fulfilled" ? results[3].value.count || 0 : 0;

    const { data: recentSessions } = await adminClient
      .from("sessions")
      .select("*, tutors(*, profiles(*)), specializations(*)")
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      adminStats: { pendingSessions, clockedInTutors, activeTutors, sessionsToday },
      recentSessions: recentSessions || [],
    });
  } catch {
    return NextResponse.json({
      adminStats: { pendingSessions: 0, clockedInTutors: 0, activeTutors: 0, sessionsToday: 0 },
      recentSessions: [],
    });
  }
}
