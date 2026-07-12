import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Verify user is an admin
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
    const rawRole = profile?.roles;
    const roleName = Array.isArray(rawRole)
      ? rawRole[0]?.name
      : (rawRole as any)?.name;
    if (!["administrator", "super_admin"].includes(roleName as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const results = await Promise.allSettled([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id, roles!inner(name)", { count: "exact", head: true })
        .eq("roles.name", "tutor"),
      supabase.from("sessions").select("id", { count: "exact", head: true }),
      supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("repositories")
        .select("id", { count: "exact", head: true }),
      supabase.from("id_cards").select("id", { count: "exact", head: true }),
      supabase.from("sessions").select("rating").not("rating", "is", null),
      supabase.from("profiles").select("roles(name)"),
      supabase.from("sessions").select("status"),
      supabase
        .from("analytics_logs")
        .select("user_id")
        .gte(
          "created_at",
          new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        ),
    ]);

    const totalUsers =
      results[0].status === "fulfilled" ? results[0].value.count : 0;
    const totalTutors =
      results[1].status === "fulfilled" ? results[1].value.count : 0;
    const totalSessions =
      results[2].status === "fulfilled" ? results[2].value.count : 0;
    const completedSessions =
      results[3].status === "fulfilled" ? results[3].value.count : 0;
    const pendingSessions =
      results[4].status === "fulfilled" ? results[4].value.count : 0;
    const totalRepositories =
      results[5].status === "fulfilled" ? results[5].value.count : 0;
    const totalCards =
      results[6].status === "fulfilled" ? results[6].value.count : 0;
    const sessionsWithRating =
      results[7].status === "fulfilled" ? results[7].value.data : [];
    const profilesWithRoles =
      results[8].status === "fulfilled" ? results[8].value.data : [];
    const sessionsByStatusData =
      results[9].status === "fulfilled" ? results[9].value.data : [];
    const dauLogs =
      results[10].status === "fulfilled" ? results[10].value.data : [];

    let dailyActiveUsers = 0;
    if (dauLogs && dauLogs.length > 0) {
      const distinctUsers = new Set(
        dauLogs.map((log: any) => log.user_id).filter(Boolean),
      );
      dailyActiveUsers = distinctUsers.size;
    }

    let avgRating = 0;
    if (sessionsWithRating && sessionsWithRating.length > 0) {
      const sum = sessionsWithRating.reduce(
        (acc, s) => acc + (s.rating || 0),
        0,
      );
      avgRating = sum / sessionsWithRating.length;
    }

    const roleCounts: Record<string, number> = {};
    type ProfileWithRole = { roles: { name: string } | { name: string }[] | null };
    (profilesWithRoles as ProfileWithRole[] || []).forEach((p) => {
      const roleArray = p.roles;
      const role = Array.isArray(roleArray)
        ? roleArray[0]?.name
        : roleArray?.name;
      const rName = role || "unknown";
      roleCounts[rName] = (roleCounts[rName] || 0) + 1;
    });

    const roleBreakdown = Object.entries(roleCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    const statusCounts: Record<string, number> = {};
    (sessionsByStatusData || []).forEach((s) => {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    });

    const sessionsByStatus = Object.entries(statusCounts).map(
      ([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }),
    );

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalTutors: totalTutors || 0,
        totalSessions: totalSessions || 0,
        completedSessions: completedSessions || 0,
        pendingSessions: pendingSessions || 0,
        totalRepositories: totalRepositories || 0,
        totalCards: totalCards || 0,
        avgRating,
        dailyActiveUsers,
        roleBreakdown,
        sessionsByStatus,
      },
    });
  } catch (error: any) {
    console.error("General analytics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
