import { createAdminClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const adminClient = await createAdminClient();

    const results = await Promise.allSettled([
      adminClient.from("profiles").select("*", { count: "exact", head: true }),
      adminClient.from("sessions").select("*", { count: "exact", head: true }),
      adminClient.from("tutors").select("*", { count: "exact", head: true }),
      adminClient.from("sessions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    const totalUsers = results[0].status === "fulfilled" ? results[0].value.count || 0 : 0;
    const totalSessions = results[1].status === "fulfilled" ? results[1].value.count || 0 : 0;
    const activeTutors = results[2].status === "fulfilled" ? results[2].value.count || 0 : 0;
    const pendingSessions = results[3].status === "fulfilled" ? results[3].value.count || 0 : 0;

    const { data: recentSessions } = await adminClient
      .from("sessions")
      .select("*, tutors(*, profiles(*)), specializations(*)")
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      adminStats: { totalUsers, totalSessions, activeTutors, pendingSessions },
      recentSessions: recentSessions || [],
    });
  } catch {
    return NextResponse.json({
      adminStats: { totalUsers: 0, totalSessions: 0, activeTutors: 0, pendingSessions: 0 },
      recentSessions: [],
    });
  }
}
