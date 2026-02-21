"use client"

import useSWR from "swr"
import { Loader2 } from "lucide-react"
import type { Profile, UserRole } from "@/lib/types"

// Lazy load dashboard components - NO SSR
import dynamic from "next/dynamic"
const AdminDashboard = dynamic(() => import("@/components/dashboard/admin-dashboard").then(m => ({ default: m.AdminDashboard })), { ssr: false })
const TutorDashboard = dynamic(() => import("@/components/dashboard/tutor-dashboard").then(m => ({ default: m.TutorDashboard })), { ssr: false })
const LearnerDashboard = dynamic(() => import("@/components/dashboard/learner-dashboard").then(m => ({ default: m.LearnerDashboard })), { ssr: false })

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to load dashboard data")
  return res.json()
}

function makeSafeProfile(data: any): Profile {
  if (data?.profile?.full_name) return data.profile
  return {
    id: data?.profile?.id || "unknown",
    full_name: data?.profile?.full_name || data?.profile?.email?.split("@")[0] || "User",
    email: data?.profile?.email || "",
    avatar_url: data?.profile?.avatar_url || null,
    created_at: data?.profile?.created_at || new Date().toISOString(),
    roles: data?.profile?.roles || { id: "fallback", name: data?.role || "learner" },
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
    return <AdminDashboard profile={profile} stats={data.adminStats || { totalUsers: 0, totalSessions: 0, activeTutors: 0, pendingSessions: 0 }} recentSessions={data.recentSessions || []} />
  }
  if (role === "tutor") {
    return <TutorDashboard profile={profile} stats={data.tutorStats || { totalSessions: 0, completedSessions: 0, upcomingSessions: 0, averageRating: 0 }} />
  }
  return <LearnerDashboard profile={profile} stats={data.learnerStats || { totalSessions: 0, completedSessions: 0, upcomingSessions: 0, averageRating: null }} />
}
