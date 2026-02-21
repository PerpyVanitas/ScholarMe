/** Tutor dashboard -- upcoming sessions, stats, and quick actions. Falls back to an error state if no tutor record exists. */
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Star, Clock, CheckCircle2, FolderOpen, ArrowRight, AlertCircle } from "lucide-react";
import { SESSION_STATUS_COLORS } from "@/lib/constants";
import type { Profile, Session, Tutor } from "@/lib/types";

interface TutorDashboardProps {
  profile: Profile;
  tutor: Tutor | null;
  upcomingSessions: Session[];
  stats: {
    completedSessions: number;
    upcomingSessions: number;
    rating: number;
    totalRatings: number;
  };
}

export function TutorDashboard({ profile, tutor, upcomingSessions, stats }: TutorDashboardProps) {
  if (!tutor) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="rounded-full bg-warning/10 p-4">
          <AlertCircle className="h-8 w-8 text-warning-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Tutor Profile Not Set Up</h2>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Your tutor profile has not been created yet. Please contact your administrator to set up your tutor profile.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {profile.full_name || "Tutor"}
        </h1>
        <p className="text-muted-foreground">
          Manage your sessions and availability.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">{stats.upcomingSessions}</span>
              <span className="text-xs text-muted-foreground">Upcoming</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">{stats.completedSessions}</span>
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/30">
              <Star className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">
                {stats.rating > 0 ? stats.rating.toFixed(1) : "N/A"}
              </span>
              <span className="text-xs text-muted-foreground">Avg Rating</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Star className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">{stats.totalRatings}</span>
              <span className="text-xs text-muted-foreground">Reviews</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Upcoming Sessions</CardTitle>
              <CardDescription>Sessions that need your attention</CardDescription>
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
                        {new Date(session.scheduled_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.specializations && (
                        <Badge variant="secondary" className="text-xs">
                          {session.specializations.name}
                        </Badge>
                      )}
                      <Badge className={SESSION_STATUS_COLORS[session.status] || ""} variant="outline">
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
            <CardDescription>Manage your tutoring</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href="/dashboard/availability" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">Manage Availability</span>
                  <span className="text-xs text-muted-foreground">Set your schedule</span>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href="/dashboard/sessions" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                  <Calendar className="h-4 w-4 text-success" />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">View Sessions</span>
                  <span className="text-xs text-muted-foreground">Manage your bookings</span>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href="/dashboard/resources" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/30">
                  <FolderOpen className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">My Repositories</span>
                  <span className="text-xs text-muted-foreground">Share study materials</span>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
