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
import { useDashboardMode } from "@/lib/hooks/use-dashboard-mode";
import { GraduationCap, BookOpen } from "lucide-react";

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
  const { viewMode, setViewMode, canSwitch } = useDashboardMode(role);
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (userLoading || !profile) return;

    const controller = new AbortController();
    const signal = controller.signal;

    async function loadDashboardData() {
      try {
        const supabase = createClient();
        const extra: DashboardData = {};

        if (role === "administrator" || role === "super_admin") {
          try {
            const res = await fetch("/api/v1/admin/dashboard-stats", { signal });
            if (res.ok) {
              const stats = await res.json();
              if (signal.aborted) return;
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
          // Always load both tutor AND learner data so toggling is instant
          const { data: tutor } = await supabase
            .from("tutors")
            .select("id, user_id, bio, rating, total_ratings, hourly_rate, years_experience")
            .eq("user_id", profile?.id || "")
            .abortSignal(signal)
            .maybeSingle();

          if (signal.aborted) return;

          if (!tutor?.id) {
            extra.tutor = (tutor as unknown as Tutor) ?? null;
            extra.upcomingSessions = [];
            extra.overdueSessions = [];
            extra.tutorStats = {
              completedSessions: 0,
              upcomingSessions: 0,
              rating: tutor?.rating || 0,
              totalRatings: tutor?.total_ratings || 0,
            };
          } else {
            const { data: sessions } = await supabase
              .from("sessions")
              .select("id, tutor_id, learner_id, scheduled_date, start_time, end_time, status, meeting_link, specializations(id, name)")
              .eq("tutor_id", tutor.id)
              .in("status", ["pending", "confirmed"])
              .order("scheduled_date", { ascending: true })
              .limit(5)
              .abortSignal(signal);

            const { count: completedCount } = await supabase
              .from("sessions")
              .select("*", { count: "exact", head: true })
              .eq("tutor_id", tutor.id)
              .eq("status", "completed")
              .abortSignal(signal);

            const { count: upcomingCount } = await supabase
              .from("sessions")
              .select("*", { count: "exact", head: true })
              .eq("tutor_id", tutor.id)
              .in("status", ["pending", "confirmed"])
              .abortSignal(signal);

            const { data: allConfirmed } = await supabase
              .from("sessions")
              .select("id, scheduled_date, end_time")
              .eq("tutor_id", tutor.id)
              .eq("status", "confirmed")
              .abortSignal(signal);

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
                    .select("id, tutor_id, learner_id, scheduled_date, start_time, end_time, status, meeting_link, specializations(id, name)")
                    .in("id", overdueSessionIds)
                    .abortSignal(signal)
                : { data: [] };

            if (signal.aborted) return;

            extra.tutor = tutor as unknown as Tutor;
            extra.upcomingSessions = (sessions as unknown as Session[]) || [];
            extra.overdueSessions = (overdueSessions as unknown as Session[]) || [];
            extra.tutorStats = {
              completedSessions: completedCount || 0,
              upcomingSessions: upcomingCount || 0,
              rating: tutor.rating || 0,
              totalRatings: tutor.total_ratings || 0,
            };
          }

          // Also load learner data for the learner view toggle
          const { data: learnSessions } = await supabase
            .from("sessions")
            .select("id, tutor_id, learner_id, scheduled_date, start_time, end_time, status, meeting_link, tutors(id, user_id, profiles(full_name, avatar_url)), specializations(id, name)")
            .eq("learner_id", profile?.id || "")
            .in("status", ["pending", "confirmed"])
            .order("scheduled_date", { ascending: true })
            .limit(5)
            .abortSignal(signal);

          const { count: learnCompletedCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("learner_id", profile?.id || "")
            .eq("status", "completed")
            .abortSignal(signal);

          const { count: learnTotalCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("learner_id", profile?.id || "")
            .abortSignal(signal);

          if (signal.aborted) return;

          // Store learner data under a separate key; render conditionally
          // We reuse upcomingSessions for whichever view is active at render
          // but store learner-specific stats separately
          extra.learnerStats = {
            totalSessions: learnTotalCount || 0,
            completedSessions: learnCompletedCount || 0,
            upcomingSessions: learnSessions?.length || 0,
          };
          // Store learner upcoming sessions so we can pass them when in learner view
          if (!extra.upcomingSessions) {
            extra.upcomingSessions = (learnSessions as unknown as Session[]) || [];
          }
          // Attach learner sessions as a separate field for toggling
          (extra as DashboardData & { learnerUpcomingSessions?: Session[] }).learnerUpcomingSessions =
            (learnSessions as unknown as Session[]) || [];
        } else {
          const { data: sessions } = await supabase
            .from("sessions")
            .select("id, tutor_id, learner_id, scheduled_date, start_time, end_time, status, meeting_link, tutors(id, user_id, profiles(full_name, avatar_url)), specializations(id, name)")
            .eq("learner_id", profile?.id || "")
            .in("status", ["pending", "confirmed"])
            .order("scheduled_date", { ascending: true })
            .limit(5)
            .abortSignal(signal);

          const { count: completedCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("learner_id", profile?.id || "")
            .eq("status", "completed")
            .abortSignal(signal);

          const { count: totalCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("learner_id", profile?.id || "")
            .abortSignal(signal);

          if (signal.aborted) return;

          extra.upcomingSessions = (sessions as unknown as Session[]) || [];
          extra.learnerStats = {
            totalSessions: totalCount || 0,
            completedSessions: completedCount || 0,
            upcomingSessions: sessions?.length || 0,
          };
        }

        setDashboardData(extra);
      } catch (err) {
        console.error("Dashboard load error:", err);
        toast.error(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard — try refreshing the page.",
        );
        setError(true);
      } finally {
        if (!signal.aborted) {
          setDataLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      controller.abort();
    };
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

  const extendedData = dashboardData as DashboardData & {
    learnerUpcomingSessions?: Session[];
  };

  if (viewMode === "learner") {
    return (
      <LearnerDashboard
        profile={profile}
        upcomingSessions={extendedData.learnerUpcomingSessions || []}
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
      <div className="flex flex-col gap-6 w-full">
        {/* Role / view mode toggle — only visible to tutors */}
        {canSwitch && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Viewing as:
            </span>
            <div className="flex items-center rounded-full border bg-muted p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode("tutor")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  viewMode === "tutor"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GraduationCap className="h-3 w-3" />
                Tutor
              </button>
              <button
                onClick={() => setViewMode("learner")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  // @ts-expect-error viewMode was narrowed above but can change
                  viewMode === "learner"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="h-3 w-3" />
                Learner
              </button>
            </div>
          </div>
        )}

        {viewMode === "tutor" ? (
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
        ) : (
          <LearnerDashboard
            profile={profile}
            upcomingSessions={extendedData.learnerUpcomingSessions || []}
            stats={
              dashboardData.learnerStats || {
                totalSessions: 0,
                completedSessions: 0,
                upcomingSessions: 0,
              }
            }
          />
        )}
      </div>
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
