// cache-bust-v3
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/create-client";
import type { UserRole } from "@/lib/types";
import { DEMO_USERS, getDemoProfileId, getDemoTutorId } from "@/lib/demo";
import { LearnerDashboard } from "@/components/dashboard/learner-dashboard";
import { TutorDashboard } from "@/components/dashboard/tutor-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth unavailable -- continue in demo mode
  }
  const cookieStore = await cookies();
  const devRole = cookieStore.get("dev_role")?.value as UserRole | undefined;

  let profile: any = null;

  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("*, roles(*)")
      .eq("id", user.id)
      .maybeSingle();
    profile = p;
  }

  const isDemoMode = !user;
  const selectedRole = (isDemoMode && devRole ? devRole : "administrator") as UserRole;

  if (user && !profile) {
    profile = {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      avatar_url: null,
      created_at: user.created_at || new Date().toISOString(),
      roles: { id: "fallback", name: "learner" },
    };
  }

  if (!profile && isDemoMode) {
    const demoProfileId = getDemoProfileId(selectedRole);
    const { data: demoProfile } = await supabase
      .from("profiles")
      .select("*, roles(*)")
      .eq("id", demoProfileId)
      .maybeSingle();

    if (demoProfile) {
      profile = demoProfile;
    } else {
      const demoInfo = DEMO_USERS[selectedRole as keyof typeof DEMO_USERS] || DEMO_USERS.administrator;
      profile = {
        id: demoInfo.profileId,
        full_name: demoInfo.fullName,
        email: demoInfo.email,
        avatar_url: null,
        created_at: new Date().toISOString(),
        roles: { id: "demo-role", name: selectedRole },
      };
    }
  }

  const role = (isDemoMode && devRole ? devRole : (profile?.roles?.name || "learner")) as UserRole;

  // Guarantee profile is never null for downstream components
  if (!profile) {
    profile = {
      id: user?.id || "unknown",
      full_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
      email: user?.email || "",
      avatar_url: null,
      created_at: new Date().toISOString(),
      roles: { id: "fallback", name: role },
    };
  }

  try {
    if (role === "administrator") {
      const results = await Promise.allSettled([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("sessions").select("*", { count: "exact", head: true }),
        supabase.from("tutors").select("*", { count: "exact", head: true }),
        supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const totalUsers = results[0].status === "fulfilled" ? results[0].value.count || 0 : 0;
      const totalSessions = results[1].status === "fulfilled" ? results[1].value.count || 0 : 0;
      const activeTutors = results[2].status === "fulfilled" ? results[2].value.count || 0 : 0;
      const pendingSessions = results[3].status === "fulfilled" ? results[3].value.count || 0 : 0;

      const { data: recentSessions } = await supabase
        .from("sessions")
        .select("*, tutors(*, profiles(*)), specializations(*)")
        .order("created_at", { ascending: false })
        .limit(5);

      return (
        <AdminDashboard
          profile={profile}
          stats={{ totalUsers, totalSessions, activeTutors, pendingSessions }}
          recentSessions={recentSessions || []}
        />
      );
    }

    if (role === "tutor") {
      const userId = user?.id || getDemoProfileId("tutor");
      const demoTutorId = getDemoTutorId("tutor");
      const { data: tutor } = await supabase
        .from("tutors")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const effectiveTutorId = tutor?.id || demoTutorId || "none";

      const { data: sessions } = await supabase
        .from("sessions")
        .select("*, specializations(*)")
        .eq("tutor_id", effectiveTutorId)
        .in("status", ["pending", "confirmed"])
        .order("scheduled_date", { ascending: true })
        .limit(5);

      const { count: completedCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("tutor_id", effectiveTutorId)
        .eq("status", "completed");

      const { count: upcomingCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("tutor_id", effectiveTutorId)
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

    const learnerId = user?.id || getDemoProfileId("learner");
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
  } catch {
    if (role === "administrator") {
      return (
        <AdminDashboard
          profile={profile}
          stats={{ totalUsers: 0, totalSessions: 0, activeTutors: 0, pendingSessions: 0 }}
          recentSessions={[]}
        />
      );
    }
    if (role === "tutor") {
      return (
        <TutorDashboard
          profile={profile}
          tutor={null}
          upcomingSessions={[]}
          stats={{ completedSessions: 0, upcomingSessions: 0, rating: 0, totalRatings: 0 }}
        />
      );
    }
    return (
      <LearnerDashboard
        profile={profile}
        upcomingSessions={[]}
        stats={{ totalSessions: 0, completedSessions: 0, upcomingSessions: 0 }}
      />
    );
  }
}
