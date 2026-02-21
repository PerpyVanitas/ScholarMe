import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/create-client";
import type { UserRole } from "@/lib/types";
import { DEMO_USERS, getDemoProfileId, getDemoTutorId } from "@/lib/demo";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth unavailable
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

  // Fallback profile for logged-in users missing a profile row
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

  // Demo mode fallback
  if (!profile && isDemoMode) {
    const selectedRole = (devRole || "administrator") as UserRole;
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

  // Final guarantee: profile is NEVER null
  if (!profile) {
    profile = {
      id: user?.id || "unknown",
      full_name: user?.user_metadata?.full_name || "User",
      email: user?.email || "",
      avatar_url: null,
      created_at: new Date().toISOString(),
      roles: { id: "fallback", name: "learner" },
    };
  }

  const role = (isDemoMode && devRole ? devRole : (profile?.roles?.name || "learner")) as UserRole;

  // Fetch role-specific data
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
        <DashboardClient
          role={role}
          profile={profile}
          adminStats={{ totalUsers, totalSessions, activeTutors, pendingSessions }}
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
        <DashboardClient
          role={role}
          profile={profile}
          tutor={tutor}
          upcomingSessions={sessions || []}
          tutorStats={{
            completedSessions: completedCount || 0,
            upcomingSessions: upcomingCount || 0,
            rating: tutor?.rating || 0,
            totalRatings: tutor?.total_ratings || 0,
          }}
        />
      );
    }

    // Learner
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
      <DashboardClient
        role={role}
        profile={profile}
        upcomingSessions={sessions || []}
        learnerStats={{
          totalSessions: totalSessionCount || 0,
          completedSessions: completedCount || 0,
          upcomingSessions: sessions?.length || 0,
        }}
      />
    );
  } catch {
    return (
      <DashboardClient
        role={role}
        profile={profile}
      />
    );
  }
}
