/**
 * ==========================================================================
 * LEARNER DASHBOARD COMPONENT
 * ==========================================================================
 *
 * PURPOSE: The main dashboard view shown to users with the "learner" role.
 * Rendered by /app/dashboard/page.tsx when role === "learner".
 *
 * SECTIONS:
 * 1. GREETING: Personalized welcome message with the learner's name
 * 2. STAT CARDS (3): Total Sessions, Completed, Upcoming
 * 3. UPCOMING SESSIONS: List of next 5 pending/confirmed sessions with
 *    tutor name, date, time, subject badge, and status badge
 * 4. QUICK ACTIONS: Shortcut buttons to Find a Tutor, My Sessions, Resources
 *
 * This is a SERVER Component (no "use client") -- it receives all data as
 * props from the parent page.tsx, which fetches from Supabase on the server.
 *
 * PROPS (passed from dashboard/page.tsx):
 * - profile: The learner's profile (name, email, etc.)
 * - upcomingSessions: Array of upcoming Session objects (with tutor + subject JOINs)
 * - stats: { totalSessions, completedSessions, upcomingSessions } counts
 * ==========================================================================
 */
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, Users, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import type { Profile, Session } from "@/lib/types";

interface LearnerDashboardProps {
  profile: Profile;
  upcomingSessions: Session[];
  stats: {
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
  };
}

/**
 * Color mapping for session status badges.
 * Each status gets a distinct background + text color using design tokens.
 */
const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning-foreground border-warning/30",
  confirmed: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/10 text-success border-success/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

export function LearnerDashboard({ profile, upcomingSessions, stats }: LearnerDashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {profile.full_name || "Learner"}
        </h1>
        <p className="text-muted-foreground">
          Here is an overview of your tutoring journey.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Calendar className="h-5 w-5 text-primary" />}
          label="Total Sessions"
          value={stats.totalSessions}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
          label="Completed"
          value={stats.completedSessions}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-accent-foreground" />}
          label="Upcoming"
          value={stats.upcomingSessions}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Upcoming Sessions</CardTitle>
              <CardDescription>Your next scheduled sessions</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/sessions" className="flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="rounded-full bg-muted p-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                <Button asChild size="sm">
                  <Link href="/dashboard/tutors">Find a Tutor</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingSessions.map((session) => (
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
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        at {session.start_time?.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.specializations && (
                        <Badge variant="secondary" className="text-xs">
                          {session.specializations.name}
                        </Badge>
                      )}
                      <Badge className={statusColors[session.status] || ""} variant="outline">
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Get started with these shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href="/dashboard/tutors" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">Find a Tutor</span>
                  <span className="text-xs text-muted-foreground">Browse available tutors</span>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href="/dashboard/sessions" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                  <Calendar className="h-4 w-4 text-success" />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">My Sessions</span>
                  <span className="text-xs text-muted-foreground">View session history</span>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href="/dashboard/resources" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/30">
                  <BookOpen className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">Resources</span>
                  <span className="text-xs text-muted-foreground">Study materials and guides</span>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * StatCard - Reusable metric card with icon, label, and number.
 * Used by the learner dashboard to show session counts.
 */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
