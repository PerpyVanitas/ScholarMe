"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { getDemoProfileId, getDemoTutorId } from "@/lib/demo"
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
  const { profile, role, loading: userLoading, isAuthenticated } = useUser()
  const [dashboardData, setDashboardData] = useState<DashboardData>({})
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Don't load dashboard data until user context is ready
    if (userLoading || !profile) return

    async function loadDashboardData() {
      try {
        const supabase = createClient()
        const extra: DashboardData = {}

        if (role === "administrator") {
          // Admin stats via server API (needs admin client)
          try {
            const res = await fetch("/api/admin/dashboard-stats")
            if (res.ok) {
              const stats = await res.json()
              extra.adminStats = stats.adminStats
              extra.recentSessions = stats.recentSessions
            }
          } catch {
            // Fallback to empty stats
          }
          if (!extra.adminStats) {
            extra.adminStats = { totalUsers: 0, totalSessions: 0, activeTutors: 0, pendingSessions: 0 }
            extra.recentSessions = []
          }
        } else if (role === "tutor") {
          const userId = isAuthenticated && profile ? profile.id : getDemoProfileId("tutor")
          const { data: tutor } = await supabase
            .from("tutors")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle()

          const tutorId = tutor?.id || getDemoTutorId("tutor") || "none"
          const { data: sessions } = await supabase
            .from("sessions")
            .select("*, specializations(*)")
            .eq("tutor_id", tutorId)
            .in("status", ["pending", "confirmed"])
            .order("scheduled_date", { ascending: true })
            .limit(5)

          const { count: completedCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("tutor_id", tutorId)
            .eq("status", "completed")

          const { count: upcomingCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("tutor_id", tutorId)
            .in("status", ["pending", "confirmed"])

          extra.tutor = tutor
          extra.upcomingSessions = sessions || []
          extra.tutorStats = {
            completedSessions: completedCount || 0,
            upcomingSessions: upcomingCount || 0,
            rating: tutor?.rating || 0,
            totalRatings: tutor?.total_ratings || 0,
          }
        } else {
          // Learner
          const learnerId = isAuthenticated && profile ? profile.id : getDemoProfileId("learner")
          const { data: sessions } = await supabase
            .from("sessions")
            .select("*, tutors(*, profiles(*)), specializations(*)")
            .eq("learner_id", learnerId)
            .in("status", ["pending", "confirmed"])
            .order("scheduled_date", { ascending: true })
            .limit(5)

          const { count: completedCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("learner_id", learnerId)
            .eq("status", "completed")

          const { count: totalCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("learner_id", learnerId)

          extra.upcomingSessions = sessions || []
          extra.learnerStats = {
            totalSessions: totalCount || 0,
            completedSessions: completedCount || 0,
            upcomingSessions: sessions?.length || 0,
          }
        }

        setDashboardData(extra)
      } catch (err) {
        console.error("Dashboard load error:", err)
        setError(true)
      } finally {
        setDataLoading(false)
      }
    }

    loadDashboardData()
  }, [profile, role, userLoading, isAuthenticated])

  // Show loading while user context or dashboard data loads
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
        <p className="text-sm text-muted-foreground">Unable to load dashboard. Please try refreshing.</p>
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
