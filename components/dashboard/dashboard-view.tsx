"use client"

import useSWR from "swr"
import { Loader2 } from "lucide-react"
import type { Profile, UserRole } from "@/lib/types"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { TutorDashboard } from "@/components/dashboard/tutor-dashboard"
import { LearnerDashboard } from "@/components/dashboard/learner-dashboard"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to load dashboard data")
  return res.json()
}

function makeSafeProfile(data: any): Profile {
  const p = data?.profile
  return {
    id: p?.id || "unknown",
    full_name: p?.full_name || p?.email?.split("@")[0] || "User",
    email: p?.email || "",
    avatar_url: p?.avatar_url || null,
    created_at: p?.created_at || new Date().toISOString(),
    role_id: p?.role_id || "",
    roles: p?.roles || { id: "fallback", name: data?.role || "learner" },
  } as Profile
}

export default function DashboardView() {
  const { data, error, isLoading } = useSWR("/api/dashboard", fetcher)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <p className="text-sm text-muted-foreground">Unable to load dashboard. Please try refreshing.</p>
      </div>
    )
  }

  const role = (data.role || "learner") as UserRole
  const profile = makeSafeProfile(data)

  if (role === "administrator") {
    return (
      <AdminDashboard
        profile={profile}
        stats={data.adminStats || { totalUsers: 0, totalSessions: 0, activeTutors: 0, pendingSessions: 0 }}
        recentSessions={data.recentSessions || []}
      />
    )
  }

  if (role === "tutor") {
    return (
      <TutorDashboard
        profile={profile}
        tutor={data.tutor || null}
        upcomingSessions={data.upcomingSessions || []}
        stats={data.tutorStats || { completedSessions: 0, upcomingSessions: 0, rating: 0, totalRatings: 0 }}
      />
    )
  }

  return (
    <LearnerDashboard
      profile={profile}
      upcomingSessions={data.upcomingSessions || []}
      stats={data.learnerStats || { totalSessions: 0, completedSessions: 0, upcomingSessions: 0 }}
    />
  )
}
