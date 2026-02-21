"use client";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { TutorDashboard } from "@/components/dashboard/tutor-dashboard";
import { LearnerDashboard } from "@/components/dashboard/learner-dashboard";
import type { UserRole, Profile, Session, Tutor } from "@/lib/types";

interface DashboardClientProps {
  role: UserRole;
  profile: Profile;
  adminStats?: {
    totalUsers: number;
    totalSessions: number;
    activeTutors: number;
    pendingSessions: number;
  };
  recentSessions?: Session[];
  tutor?: Tutor | null;
  upcomingSessions?: Session[];
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

export function DashboardClient({
  role,
  profile,
  adminStats,
  recentSessions,
  tutor,
  upcomingSessions,
  tutorStats,
  learnerStats,
}: DashboardClientProps) {
  // Final safety: guarantee profile is never null on the client
  const safeProfile = profile || {
    id: "unknown",
    full_name: "User",
    email: "",
    avatar_url: null,
    created_at: new Date().toISOString(),
    roles: { id: "fallback", name: role },
  };

  if (role === "administrator") {
    return (
      <AdminDashboard
        profile={safeProfile}
        stats={adminStats || { totalUsers: 0, totalSessions: 0, activeTutors: 0, pendingSessions: 0 }}
        recentSessions={recentSessions || []}
      />
    );
  }

  if (role === "tutor") {
    return (
      <TutorDashboard
        profile={safeProfile}
        tutor={tutor || null}
        upcomingSessions={upcomingSessions || []}
        stats={tutorStats || { completedSessions: 0, upcomingSessions: 0, rating: 0, totalRatings: 0 }}
      />
    );
  }

  return (
    <LearnerDashboard
      profile={safeProfile}
      upcomingSessions={upcomingSessions || []}
      stats={learnerStats || { totalSessions: 0, completedSessions: 0, upcomingSessions: 0 }}
    />
  );
}
