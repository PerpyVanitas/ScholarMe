import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { LearnerDashboard } from "@/components/dashboard/learner-dashboard";
import { TutorDashboard } from "@/components/dashboard/tutor-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: any = null;

  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("*, roles(*)")
      .eq("id", user.id)
      .single();
    profile = p;
  }

  // Demo profile for development
  if (!profile) {
    profile = {
      id: "demo",
      full_name: "Admin Demo",
      email: "admin@scholarme.org",
      avatar_url: null,
      created_at: new Date().toISOString(),
      roles: { id: "demo-role", name: "administrator" },
    };
  }

  const role = (profile.roles?.name || "learner") as UserRole;

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
    const { data: tutor } = await supabase
      .from("tutors")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const { data: sessions } = await supabase
      .from("sessions")
      .select("*, specializations(*)")
      .eq("tutor_id", tutor?.id || "")
      .in("status", ["pending", "confirmed"])
      .order("scheduled_date", { ascending: true })
      .limit(5);

    const { count: completedCount } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("tutor_id", tutor?.id || "")
      .eq("status", "completed");

    const { count: upcomingCount } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("tutor_id", tutor?.id || "")
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
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, tutors(*, profiles(*)), specializations(*)")
    .eq("learner_id", user.id)
    .in("status", ["pending", "confirmed"])
    .order("scheduled_date", { ascending: true })
    .limit(5);

  const { count: completedCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("learner_id", user.id)
    .eq("status", "completed");

  const { count: totalSessionCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("learner_id", user.id);

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
