import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { createAdminClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

/** GET /api/android/dashboard/stats — role-aware dashboard stats */
export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Missing authorization token" } },
        { status: 401 }
      );
    }

    const supabase = createSupabaseForBearer(token);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } },
        { status: 401 }
      );
    }

    // Determine role
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles:roles!role_id(name)")
      .eq("id", authData.user.id)
      .single();
    const roleName: string = Array.isArray(profile?.roles)
      ? (profile.roles[0]?.name ?? "learner")
      : ((profile?.roles as any)?.name ?? "learner");

    if (roleName === "administrator") {
      const adminClient = await createAdminClient();
      const [usersRes, sessionsRes, tutorsRes, pendingRes] = await Promise.all([
        adminClient.from("profiles").select("*", { count: "exact", head: true }),
        adminClient.from("sessions").select("*", { count: "exact", head: true }),
        adminClient.from("tutors").select("*", { count: "exact", head: true }),
        adminClient.from("sessions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return NextResponse.json({
        success: true,
        data: {
          role: "administrator",
          totalUsers: usersRes.count ?? 0,
          totalSessions: sessionsRes.count ?? 0,
          activeTutors: tutorsRes.count ?? 0,
          pendingSessions: pendingRes.count ?? 0,
          totalStudySets: 0,
          averageQuizScore: 0,
        },
      });
    }

    if (roleName === "tutor") {
      const { data: tutorRow } = await supabase.from("tutors").select("id, rating, total_ratings").eq("user_id", authData.user.id).single();
      const tutorId = tutorRow?.id ?? "none";
      const [completedRes, upcomingRes] = await Promise.all([
        supabase.from("sessions").select("*", { count: "exact", head: true }).eq("tutor_id", tutorId).eq("status", "completed"),
        supabase.from("sessions").select("*", { count: "exact", head: true }).eq("tutor_id", tutorId).in("status", ["pending", "confirmed"]),
      ]);
      return NextResponse.json({
        success: true,
        data: {
          role: "tutor",
          completedSessions: completedRes.count ?? 0,
          upcomingSessions: upcomingRes.count ?? 0,
          rating: tutorRow?.rating ?? 0,
          totalRatings: tutorRow?.total_ratings ?? 0,
          totalStudySets: 0,
          averageQuizScore: 0,
        },
      });
    }

    // Learner
    const [completedRes, upcomingRes, totalRes] = await Promise.all([
      supabase.from("sessions").select("*", { count: "exact", head: true }).eq("learner_id", authData.user.id).eq("status", "completed"),
      supabase.from("sessions").select("*", { count: "exact", head: true }).eq("learner_id", authData.user.id).in("status", ["pending", "confirmed"]),
      supabase.from("sessions").select("*", { count: "exact", head: true }).eq("learner_id", authData.user.id),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        role: "learner",
        totalSessions: totalRes.count ?? 0,
        completedSessions: completedRes.count ?? 0,
        upcomingSessions: upcomingRes.count ?? 0,
        totalStudySets: 0,
        averageQuizScore: 0,
      },
    });
  } catch (error) {
    console.error("[Android Dashboard] GET stats error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch dashboard stats" } },
      { status: 500 }
    );
  }
}
