"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, GraduationCap, Clock, ArrowRight, BarChart3, CreditCard } from "lucide-react"
import { SESSION_STATUS_COLORS } from "@/lib/constants"
import { AdminStatModal } from "@/components/panel/admin-stat-modal"
import type { Profile, Session } from "@/lib/types"

type StatType = "users" | "tutors" | "sessions" | "pending"

interface AdminDashboardProps {
  profile: Profile
  stats: {
    totalUsers: number
    totalSessions: number
    activeTutors: number
    pendingSessions: number
  }
  recentSessions: Session[]
}

export function AdminDashboard({ profile, stats, recentSessions }: AdminDashboardProps) {
  const [modalType, setModalType] = useState<StatType | null>(null)

  const statCards: { type: StatType; value: number; label: string; icon: React.ReactNode; bg: string }[] = [
    {
      type: "users",
      value: stats.totalUsers,
      label: "Total Users",
      icon: <Users className="h-5 w-5 text-primary" />,
      bg: "bg-primary/10",
    },
    {
      type: "tutors",
      value: stats.activeTutors,
      label: "Active Tutors",
      icon: <GraduationCap className="h-5 w-5 text-success" />,
      bg: "bg-success/10",
    },
    {
      type: "sessions",
      value: stats.totalSessions,
      label: "Total Sessions",
      icon: <Calendar className="h-5 w-5 text-accent-foreground" />,
      bg: "bg-accent/30",
    },
    {
      type: "pending",
      value: stats.pendingSessions,
      label: "Pending",
      icon: <Clock className="h-5 w-5 text-warning-foreground" />,
      bg: "bg-warning/10",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Organization overview and management tools.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card
            key={card.type}
            className="border-border/60 cursor-pointer transition-shadow hover:shadow-md hover:border-primary/30"
            onClick={() => setModalType(card.type)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                {card.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-foreground">{card.value}</span>
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminStatModal
        type={modalType || "users"}
        open={modalType !== null}
        onOpenChange={(open) => { if (!open) setModalType(null) }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Recent Sessions</CardTitle>
              <CardDescription>Latest session activity</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/panel/admin/sessions" className="flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="rounded-full bg-muted p-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No sessions yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        {session.tutors?.profiles?.full_name || "Tutor"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.scheduled_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        at {session.start_time?.slice(0, 5)}
                      </span>
                    </div>
                    <Badge className={SESSION_STATUS_COLORS[session.status] || ""} variant="outline">
                      {session.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Admin Tools</CardTitle>
            <CardDescription>Manage your organization</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href="/panel/admin/users" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">User Management</span>
                  <span className="text-xs text-muted-foreground">Create and manage accounts</span>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href="/panel/admin/cards" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                  <CreditCard className="h-4 w-4 text-success" />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">Card Management</span>
                  <span className="text-xs text-muted-foreground">Issue and revoke auth cards</span>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href="/panel/admin/analytics" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/30">
                  <BarChart3 className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">Analytics</span>
                  <span className="text-xs text-muted-foreground">View insights and reports</span>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
