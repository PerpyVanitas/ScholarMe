"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { TutorDashboard } from "@/components/dashboard/tutor-dashboard"
import { LearnerDashboard } from "@/components/dashboard/learner-dashboard"
import type { Session, Tutor } from "@/lib/types"

interface DashboardData {
  adminStats?: {
    totalUsers: number
    totalSessions: number
    activeTutors: number
    pendingSessions: number
  }
  recentSessions?: Session[]
  tutor?: Tutor | null
  upcomingSessions?: Session[]
  tutorStats?: {
    completedSessions: number
    upcomingSessions: number
    rating: number
    totalRatings: number
  }
  learnerStats?: {
    totalSessions: number
    completedSessions: number
    upcomingSessions: number
  }
}

export default function DashboardView() {
  const { profile, role, loading: userLoading } = useUser()
  const [dashboardData, setDashboardData] = useState<DashboardData>({})
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (userLoading || !profile) return

    async function loadDashboardData() {
      try {
        // Use the dedicated /api/dashboard route — handles all role-based
        // data fetching securely on the server with correct profile_id FK.
        const res = await fetch("/api/dashboard")
        if (!res.ok) throw new Error("Failed to fetch dashboard data")

        const data = await res.json()

        setDashboardData({
          adminStats: data.adminStats,
          recentSessions: data.recentSessions || [],
          tutor: data.tutor || null,
          upcomingSessions: data.upcomingSessions || [],
          tutorStats: data.tutorStats,
          learnerStats: data.learnerStats,
        })
      } catch (err) {
        console.error("Dashboard load error:", err)
        setError(true)
      } finally {
        setDataLoading(false)
      }
    }

    loadDashboardData()
  }, [profile, role, userLoading])

  if (userLoading || dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <p className="text-sm text-muted-foreground">
          Unable to load dashboard. Please try refreshing.
        </p>
      </div>
    )
  }

  if (role === "administrator") {
    return (
      <AdminDashboard
        profile={profile}
        stats={dashboardData.adminStats || { totalUsers: 0, totalSessions: 0, activeTutors: 0, pendingSessions: 0 }}
        recentSessions={dashboardData.recentSessions || []}
      />
    )
  }

  if (role === "tutor") {
    return (
      <TutorDashboard
        profile={profile}
        tutor={dashboardData.tutor || null}
        upcomingSessions={dashboardData.upcomingSessions || []}
        stats={dashboardData.tutorStats || { completedSessions: 0, upcomingSessions: 0, rating: 0, totalRatings: 0 }}
      />
    )
  }

  return (
    <LearnerDashboard
      profile={profile}
      upcomingSessions={dashboardData.upcomingSessions || []}
      stats={dashboardData.learnerStats || { totalSessions: 0, completedSessions: 0, upcomingSessions: 0 }}
    />
  )
}
