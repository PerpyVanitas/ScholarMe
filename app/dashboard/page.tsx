import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";
import { LearnerDashboard } from "@/components/dashboard/learner-dashboard";
import { TutorDashboard } from "@/components/dashboard/tutor-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const devRole = cookieStore.get("dev_role")?.value as UserRole | undefined;

  let profile: any = null;

  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("*, roles(*)")
      .eq("id", user.id)
      .single();
    profile = p;
  }

  const isDemoMode = !user;

  // Demo profile for development
  if (!profile) {
    const selectedRole = devRole || "administrator";
    const demoNames: Record<string, string> = {
      learner: "Learner Demo",
      tutor: "Tutor Demo",
      administrator: "Admin Demo",
    };
    profile = {
      id: "demo",
      full_name: demoNames[selectedRole],
      email: "demo@scholarme.org",
      avatar_url: null,
      created_at: new Date().toISOString(),
      roles: { id: "demo-role", name: selectedRole },
    };
  }

  const role = (isDemoMode && devRole ? devRole : (profile.roles?.name || "learner")) as UserRole;

  if (role === "administrator") {
    // Admin stats
    const [
      { count: totalUsers },
      { count: totalSessions },
      { count: activeTutors },
      { count: pendingSessions },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("sessions").select("*", { count: "exact", head: true }),
      supabase.from("tutors").select("*", { count: "exact", head: true }),
      supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    const { data: recentSessions } = await supabase
      .from("sessions")
      .select("*, tutors(*, profiles(*)), specializations(*)")
      .order("created_at", { ascending: false })
      .limit(5);

    return (
      <AdminDashboard
        profile={profile}
        stats={{
          totalUsers: totalUsers || 0,
          totalSessions: totalSessions || 0,
          activeTutors: activeTutors || 0,
          pendingSessions: pendingSessions || 0,
        }}
        recentSessions={recentSessions || []}
      />
    );
  }

  if (role === "tutor") {
    const userId = user?.id || "demo";
    const { data: tutor } = await supabase
      .from("tutors")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data: sessions } = await supabase
      .from("sessions")
      .select("*, specializations(*)")
      .eq("tutor_id", tutor?.id || "none")
      .in("status", ["pending", "confirmed"])
      .order("scheduled_date", { ascending: true })
      .limit(5);

    const { count: completedCount } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("tutor_id", tutor?.id || "none")
      .eq("status", "completed");

    const { count: upcomingCount } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("tutor_id", tutor?.id || "none")
      .in("status", ["pending", "confirmed"]);

    return (
      <TutorDashboard
        profile={profile}
        tutor={tutor}
        upcomingSessions={sessions || []}
        stats={{
          completedSessions: completedCount || 0,
          upcomingSessions: upcomingCount || 0,
          rating: tutor?.rating || 0,
          totalRatings: tutor?.total_ratings || 0,
        }}
      />
    );
  }

  // Learner
  const learnerId = user?.id || "demo";
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, tutors(*, profiles(*)), specializations(*)")
    .eq("learner_id", learnerId)
    .in("status", ["pending", "confirmed"])
    .order("scheduled_date", { ascending: true })
    .limit(5);

  const { count: completedCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("learner_id", learnerId)
    .eq("status", "completed");

  const { count: totalSessionCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("learner_id", learnerId);

  return (
    <LearnerDashboard
      profile={profile}
      upcomingSessions={sessions || []}
      stats={{
        totalSessions: totalSessionCount || 0,
        completedSessions: completedCount || 0,
        upcomingSessions: sessions?.length || 0,
      }}
    />
  );
}
