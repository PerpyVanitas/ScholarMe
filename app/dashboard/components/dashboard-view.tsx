"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/lib/user-context";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";
import { TutorDashboard } from "@/features/tutors/components/tutor-dashboard";
import { LearnerDashboard } from "@/features/sessions/components/learner-dashboard";
import type { Session, Tutor } from "@/lib/types";
import { toast } from "sonner";
import { ensureTutor } from "@/app/dashboard/profile/actions";

interface DashboardData {
  adminStats?: {
    pendingSessions: number;
    clockedInTutors: number;
    activeTutors: number;
    sessionsToday: number;
  };
  recentSessions?: Session[];
  tutor?: Tutor | null;
  upcomingSessions?: Session[];
  overdueSessions?: Session[];
  tutorStats?: {
    completedSessions: number;
    upcomingSessions: number;
    rating: number;
    totalRatings: number;
  };
  learnerStats?: {
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
  };
}

export default function DashboardView() {
  const { profile, role, loading: userLoading, isAuthenticated } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (userLoading || !profile) return;

    async function loadDashboardData() {
      try {
        const supabase = createClient();
        const extra: DashboardData = {};

        if (role === "administrator" || role === "super_admin") {
          try {
            const res = await fetch("/api/admin/dashboard-stats");
            if (res.ok) {
              const stats = await res.json();
              extra.adminStats = stats.adminStats;
              extra.recentSessions = stats.recentSessions;
            }
          } catch {
            extra.adminStats = undefined;
          }

          if (!extra.adminStats) {
            extra.adminStats = {
              pendingSessions: 0,
              clockedInTutors: 0,
              activeTutors: 0,
              sessionsToday: 0,
            };
            extra.recentSessions = [];
          }
        } else if (role === "tutor") {
          if (isAuthenticated) {
            await ensureTutor();
          }

          const { data: tutor } = await supabase
            .from("tutors")
            .select("*")
            .eq("user_id", profile?.id || "")
            .maybeSingle();

          if (!tutor?.id) {
            extra.tutor = tutor ?? null;
            extra.upcomingSessions = [];
            extra.overdueSessions = [];
            extra.tutorStats = {
              completedSessions: 0,
              upcomingSessions: 0,
              rating: tutor?.rating || 0,
              totalRatings: tutor?.total_ratings || 0,
            };
            setDashboardData(extra);
            return;
          }

          const { data: sessions } = await supabase
            .from("sessions")
            .select("*, specializations(*)")
            .eq("tutor_id", tutor.id)
            .in("status", ["pending", "confirmed"])
            .order("scheduled_date", { ascending: true })
            .limit(5);

          const { count: completedCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("tutor_id", tutor.id)
            .eq("status", "completed");

          const { count: upcomingCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("tutor_id", tutor.id)
            .in("status", ["pending", "confirmed"]);

          const { data: allConfirmed } = await supabase
            .from("sessions")
            .select("id, scheduled_date, end_time")
            .eq("tutor_id", tutor.id)
            .eq("status", "confirmed");

          const now = new Date();
          const overdueSessionIds =
            allConfirmed
              ?.filter((session) => {
                const endDateTime = new Date(
                  `${session.scheduled_date}T${session.end_time}`,
                );
                return endDateTime < now;
              })
              .map((session) => session.id) || [];

          const { data: overdueSessions } =
            overdueSessionIds.length > 0
              ? await supabase
                  .from("sessions")
                  .select("*, specializations(*)")
                  .in("id", overdueSessionIds)
              : { data: [] };

          extra.tutor = tutor;
          extra.upcomingSessions = sessions || [];
          extra.overdueSessions = overdueSessions || [];
          extra.tutorStats = {
            completedSessions: completedCount || 0,
            upcomingSessions: upcomingCount || 0,
            rating: tutor.rating || 0,
            totalRatings: tutor.total_ratings || 0,
          };
        } else {
          const { data: sessions } = await supabase
            .from("sessions")
            .select("*, tutors(*, profiles(*)), specializations(*)")
            .eq("learner_id", profile?.id || "")
            .in("status", ["pending", "confirmed"])
            .order("scheduled_date", { ascending: true })
            .limit(5);

          const { count: completedCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("learner_id", profile?.id || "")
            .eq("status", "completed");

          const { count: totalCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("learner_id", profile?.id || "");

          extra.upcomingSessions = sessions || [];
          extra.learnerStats = {
            totalSessions: totalCount || 0,
            completedSessions: completedCount || 0,
            upcomingSessions: sessions?.length || 0,
          };
        }

        setDashboardData(extra);
      } catch (err) {
        console.error("Dashboard load error:", err);
        toast.error(err instanceof Error ? err.message : "An error occurred");
        setError(true);
      } finally {
        setDataLoading(false);
      }
    }

    loadDashboardData();
  }, [profile, role, userLoading, isAuthenticated]);

  if (userLoading || dataLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px] w-full rounded-xl" />
          <Skeleton className="h-[120px] w-full rounded-xl" />
          <Skeleton className="h-[120px] w-full rounded-xl" />
          <Skeleton className="h-[120px] w-full rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="h-[400px] w-full rounded-xl lg:col-span-4" />
          <Skeleton className="h-[400px] w-full rounded-xl lg:col-span-3" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <p className="text-sm text-muted-foreground">
          Unable to load dashboard. Please try refreshing.
        </p>
      </div>
    );
  }

  if (role === "administrator" || role === "super_admin") {
    return (
      <AdminDashboard
        profile={profile}
        stats={
          dashboardData.adminStats || {
            pendingSessions: 0,
            clockedInTutors: 0,
            activeTutors: 0,
            sessionsToday: 0,
          }
        }
        recentSessions={dashboardData.recentSessions || []}
      />
    );
  }

  if (role === "tutor") {
    return (
      <TutorDashboard
        profile={profile}
        tutor={dashboardData.tutor || null}
        upcomingSessions={dashboardData.upcomingSessions || []}
        overdueSessions={dashboardData.overdueSessions || []}
        stats={
          dashboardData.tutorStats || {
            completedSessions: 0,
            upcomingSessions: 0,
            rating: 0,
            totalRatings: 0,
          }
        }
      />
    );
  }

  return (
    <LearnerDashboard
      profile={profile}
      upcomingSessions={dashboardData.upcomingSessions || []}
      stats={
        dashboardData.learnerStats || {
          totalSessions: 0,
          completedSessions: 0,
          upcomingSessions: 0,
        }
      }
    />
  );
}
