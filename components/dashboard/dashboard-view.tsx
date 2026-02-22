"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { DEMO_USERS, getDemoUserFromCookie, getDemoProfileId, getDemoTutorId } from "@/lib/demo"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { TutorDashboard } from "@/components/dashboard/tutor-dashboard"
import { LearnerDashboard } from "@/components/dashboard/learner-dashboard"
import type { Profile, UserRole } from "@/lib/types"

export default function DashboardView() {
  const [role, setRole] = useState<UserRole>("learner")
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        let currentProfile: Profile | null = null
        let currentRole: UserRole = "learner"

        if (user) {
          // Logged-in user
          const { data: p } = await supabase
            .from("profiles")
            .select("*, roles(*)")
            .eq("id", user.id)
            .maybeSingle()

          if (p) {
            currentProfile = p as Profile
            currentRole = (p.roles?.name || "learner") as UserRole
          } else {
            currentProfile = {
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
              email: user.email || "",
              avatar_url: null,
              created_at: user.created_at || new Date().toISOString(),
              role_id: "",
              roles: { id: "fallback", name: "learner" },
            } as Profile
            currentRole = "learner"
          }
        } else {
          // Demo mode
          const { role: demoRole } = getDemoUserFromCookie("learner")
          currentRole = demoRole as UserRole
          const demoProfileId = getDemoProfileId(currentRole)
          const { data: demoProfile } = await supabase
            .from("profiles")
            .select("*, roles(*)")
            .eq("id", demoProfileId)
            .maybeSingle()

          if (demoProfile) {
            currentProfile = demoProfile as Profile
          } else {
            const info = DEMO_USERS[currentRole as keyof typeof DEMO_USERS] || DEMO_USERS.learner
            currentProfile = {
              id: info.profileId,
              full_name: info.fullName,
              email: info.email,
              avatar_url: null,
              created_at: new Date().toISOString(),
              role_id: "",
              roles: { id: "demo", name: currentRole },
            } as Profile
          }
        }

        setProfile(currentProfile)
        setRole(currentRole)

        // Load role-specific dashboard data
        const extra: any = {}

        if (currentRole === "administrator") {
          // Admin stats -- use the server API for admin since it needs admin client
          try {
            const res = await fetch("/api/admin/dashboard-stats")
            if (res.ok) {
              const stats = await res.json()
              extra.adminStats = stats.adminStats
              extra.recentSessions = stats.recentSessions
            }
          } catch {
            // fallback
          }
          if (!extra.adminStats) {
            extra.adminStats = { totalUsers: 0, totalSessions: 0, activeTutors: 0, pendingSessions: 0 }
            extra.recentSessions = []
          }
        } else if (currentRole === "tutor") {
          const userId = user?.id || getDemoProfileId("tutor")
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
          const learnerId = user?.id || getDemoProfileId("learner")
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
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
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
        stats={dashboardData?.adminStats || { totalUsers: 0, totalSessions: 0, activeTutors: 0, pendingSessions: 0 }}
        recentSessions={dashboardData?.recentSessions || []}
      />
    )
  }

  if (role === "tutor") {
    return (
      <TutorDashboard
        profile={profile}
        tutor={dashboardData?.tutor || null}
        upcomingSessions={dashboardData?.upcomingSessions || []}
        stats={dashboardData?.tutorStats || { completedSessions: 0, upcomingSessions: 0, rating: 0, totalRatings: 0 }}
      />
    )
  }

  return (
    <LearnerDashboard
      profile={profile}
      upcomingSessions={dashboardData?.upcomingSessions || []}
      stats={dashboardData?.learnerStats || { totalSessions: 0, completedSessions: 0, upcomingSessions: 0 }}
    />
  )
}
