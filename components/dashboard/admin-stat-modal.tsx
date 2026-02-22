"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, GraduationCap, Calendar, Clock, Star } from "lucide-react"
import { SESSION_STATUS_COLORS } from "@/lib/constants"

type StatType = "users" | "tutors" | "sessions" | "pending"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STAT_CONFIG: Record<StatType, { title: string; description: string; icon: React.ReactNode }> = {
  users: {
    title: "All Users",
    description: "Every registered user in the system",
    icon: <Users className="h-5 w-5 text-primary" />,
  },
  tutors: {
    title: "Active Tutors",
    description: "All registered tutors",
    icon: <GraduationCap className="h-5 w-5 text-success" />,
  },
  sessions: {
    title: "All Sessions",
    description: "Every tutoring session",
    icon: <Calendar className="h-5 w-5 text-accent-foreground" />,
  },
  pending: {
    title: "Pending Sessions",
    description: "Sessions awaiting confirmation",
    icon: <Clock className="h-5 w-5 text-warning-foreground" />,
  },
}

function getInitials(name?: string) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function UserRow({ user }: { user: Record<string, unknown> }) {
  const profile = user as { id: string; full_name: string; email: string; avatar_url: string | null; roles?: { name: string } }
  return (
    <Link
      href={`/d/admin/users`}
      className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/50"
    >
      <Avatar className="h-9 w-9">
        <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
        <AvatarFallback className="text-xs">{getInitials(profile.full_name)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">{profile.full_name || "Unnamed"}</span>
        <span className="text-xs text-muted-foreground truncate">{profile.email}</span>
      </div>
      {profile.roles?.name && (
        <Badge variant="outline" className="capitalize shrink-0">{profile.roles.name}</Badge>
      )}
    </Link>
  )
}

function TutorRow({ tutor }: { tutor: Record<string, unknown> }) {
  const t = tutor as {
    id: string
    rating: number
    profiles?: { id: string; full_name: string; email: string; avatar_url: string | null }
    tutor_specializations?: { specializations: { name: string } }[]
  }
  const profile = t.profiles
  return (
    <Link
      href={`/d/tutors/${t.id}`}
      className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/50"
    >
      <Avatar className="h-9 w-9">
        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name} />
        <AvatarFallback className="text-xs">{getInitials(profile?.full_name)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">{profile?.full_name || "Unnamed"}</span>
        <span className="text-xs text-muted-foreground truncate">
          {t.tutor_specializations?.map((ts) => ts.specializations?.name).filter(Boolean).join(", ") || "No specializations"}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
        <span className="text-xs text-muted-foreground">{t.rating?.toFixed(1) || "0.0"}</span>
      </div>
    </Link>
  )
}

function SessionRow({ session }: { session: Record<string, unknown> }) {
  const s = session as {
    id: string
    scheduled_date: string
    start_time: string
    status: string
    tutors?: { profiles?: { full_name: string } }
    learner_profile?: { full_name: string }
    specializations?: { name: string }
  }
  return (
    <Link
      href={`/d/sessions`}
      className="flex items-center justify-between rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          {s.tutors?.profiles?.full_name || "Tutor"} &rarr; {s.learner_profile?.full_name || "Learner"}
        </span>
        <span className="text-xs text-muted-foreground">
          {s.specializations?.name ? `${s.specializations.name} - ` : ""}
          {new Date(s.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          {s.start_time ? ` at ${s.start_time.slice(0, 5)}` : ""}
        </span>
      </div>
      <Badge className={SESSION_STATUS_COLORS[s.status] || ""} variant="outline">
        {s.status}
      </Badge>
    </Link>
  )
}

export function AdminStatModal({
  type,
  open,
  onOpenChange,
}: {
  type: StatType
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const config = STAT_CONFIG[type]
  const { data, isLoading } = useSWR(open ? `/api/admin/stats/${type}` : null, fetcher)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {config.icon}
            <DialogTitle>{config.title}</DialogTitle>
          </div>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data || data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <p className="text-sm text-muted-foreground">No items found</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pb-2">
              {(type === "users") && data.map((item: Record<string, unknown>) => (
                <UserRow key={item.id as string} user={item} />
              ))}
              {(type === "tutors") && data.map((item: Record<string, unknown>) => (
                <TutorRow key={item.id as string} tutor={item} />
              ))}
              {(type === "sessions" || type === "pending") && data.map((item: Record<string, unknown>) => (
                <SessionRow key={item.id as string} session={item} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
