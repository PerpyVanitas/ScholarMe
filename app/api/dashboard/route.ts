import { createClient, createAdminClient } from "@/lib/supabase/create-client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEMO_USERS, getDemoProfileId, getDemoTutorId } from "@/lib/demo";
import type { UserRole, Profile } from "@/lib/types";

export async function GET() {
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

  let profile: Profile | null = null;
  const isDemoMode = !user;

  // Fetch profile for logged-in users
  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("*, roles(*)")
      .eq("id", user.id)
      .maybeSingle();
    profile = p;
  }

  // Fallback for logged-in users missing a profile row
  if (user && !profile) {
    profile = {
      id: user.id,
      role_id: null,
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      avatar_url: null,
      phone_number: null,
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
        role_id: null,
        full_name: demoInfo.fullName,
        email: demoInfo.email,
        avatar_url: null,
        phone_number: null,
        created_at: new Date().toISOString(),
        roles: { id: "demo-role", name: selectedRole },
      };
    }
  }

  // Final guarantee
  if (!profile) {
    profile = {
      id: user?.id || "unknown",
      role_id: null,
      full_name: user?.user_metadata?.full_name || "User",
      email: user?.email || "",
      avatar_url: null,
      phone_number: null,
      created_at: new Date().toISOString(),
      roles: { id: "fallback", name: "learner" },
    };
  }

  const role = (isDemoMode && devRole ? devRole : (profile?.roles?.name || "learner")) as UserRole;

  try {
    if (role === "administrator") {
      // SECURITY: Prevent data leak by blocking adminClient in demo mode
      if (isDemoMode) {
        return NextResponse.json({
          role,
          profile,
          adminStats: { totalUsers: 142, totalSessions: 450, activeTutors: 25, pendingSessions: 12 },
          recentSessions: [],
        });
      }

      // Use admin client to bypass RLS for org-wide stats
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
        role,
        profile,
        adminStats: { totalUsers, totalSessions, activeTutors, pendingSessions },
        recentSessions: recentSessions || [],
      });
    }

    if (role === "tutor") {
      const userId = user?.id || getDemoProfileId("tutor");
      const demoTutorId = getDemoTutorId("tutor");
      const { data: tutor } = await supabase
        .from("tutors")
        .select("*")
        .eq("profile_id", userId)
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

      return NextResponse.json({
        role,
        profile,
        tutor,
        upcomingSessions: sessions || [],
        tutorStats: {
          completedSessions: completedCount || 0,
          upcomingSessions: upcomingCount || 0,
          rating: tutor?.rating || 0,
          totalRatings: tutor?.total_ratings || 0,
        },
      });
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

    return NextResponse.json({
      role,
      profile,
      upcomingSessions: sessions || [],
      learnerStats: {
        totalSessions: totalSessionCount || 0,
        completedSessions: completedCount || 0,
        upcomingSessions: sessions?.length || 0,
      },
    });
  } catch {
    return NextResponse.json({ role, profile });
  }
}
