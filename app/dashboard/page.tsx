"use client"

import useSWR from "swr"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { Loader2 } from "lucide-react"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to load dashboard data")
  return res.json()
}

export default function DashboardPage() {
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

  return (
    <DashboardClient
      role={data.role}
      profile={data.profile}
      adminStats={data.adminStats}
      recentSessions={data.recentSessions}
      tutor={data.tutor}
      upcomingSessions={data.upcomingSessions}
      tutorStats={data.tutorStats}
      learnerStats={data.learnerStats}
    />
  )
}