"use client"

import useSWR from "swr"
import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

const AdminDashboard = dynamic(() => import("@/components/dashboard/admin-dashboard").then(m => ({ default: m.default })), { ssr: false })
const TutorDashboard = dynamic(() => import("@/components/dashboard/tutor-dashboard").then(m => ({ default: m.default })), { ssr: false })
const LearnerDashboard = dynamic(() => import("@/components/dashboard/learner-dashboard").then(m => ({ default: m.default })), { ssr: false })

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to load dashboard")
  return res.json()
}

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR("/api/dashboard", fetcher)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center flex-1 p-12">
        <p className="text-muted-foreground">Failed to load dashboard. Please refresh.</p>
      </div>
    )
  }

  const { profile, role, stats } = data

  const safeProfile = profile || {
    id: "unknown",
    full_name: "User",
    email: "",
    avatar_url: null,
    created_at: new Date().toISOString(),
    roles: { name: role || "learner" },
  }

  if (role === "administrator") return <AdminDashboard profile={safeProfile} stats={stats} />
  if (role === "tutor") return <TutorDashboard profile={safeProfile} stats={stats} />
  return <LearnerDashboard profile={safeProfile} stats={stats} />
}
