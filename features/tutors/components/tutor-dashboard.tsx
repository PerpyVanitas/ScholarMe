"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Star,
  Clock,
  CheckCircle2,
  FolderOpen,
  ArrowRight,
  LogIn,
  LogOut,
  Timer,
  UserCircle,
  AlertTriangle,
  GripVertical,
  Settings2,
} from "lucide-react";
import { SESSION_STATUS_COLORS } from "@/lib/constants";
import { toast } from "sonner";
import type { Profile, Session, Tutor } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TutorDashboardProps {
  profile: Profile;
  tutor: Tutor | null;
  upcomingSessions: Session[];
  overdueSessions?: Session[];
  stats: {
    completedSessions: number;
    upcomingSessions: number;
    rating: number;
    totalRatings: number;
  };
}

const DEFAULT_LAYOUT = [
  "overdue",
  "clock_in",
  "stats",
  "upcoming_sessions",
  "quick_actions",
];

function SortableItem({
  id,
  children,
  isEditing,
}: {
  id: string;
  children: React.ReactNode;
  isEditing: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        "relative" +
        (isEditing
          ? " ring-2 ring-primary/20 rounded-xl bg-background/50 mb-4"
          : "")
      }
    >
      {isEditing && (
        <div
          className="absolute -left-3 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing bg-background border rounded-lg shadow-sm z-10 hover:bg-muted"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className={isEditing ? "pl-8 opacity-70 pointer-events-none" : ""}>
        {children}
      </div>
    </div>
  );
}

export function TutorDashboard({
  profile,
  tutor,
  upcomingSessions,
  overdueSessions = [],
  stats,
}: TutorDashboardProps) {
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockCheckDone, setClockCheckDone] = useState(false);

  const [layout, setLayout] = useState<string[]>(DEFAULT_LAYOUT);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);

  useEffect(() => {
    const widgets = (profile as any)?.dashboard_layout?.widgets;
    if (Array.isArray(widgets)) {
      const merged = [...new Set([...widgets, ...DEFAULT_LAYOUT])].filter(
        (id) => DEFAULT_LAYOUT.includes(id),
      );
      setLayout(merged);
    }
  }, [profile]);

  const checkClockStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/timesheets");
      if (res.ok) {
        const data = await res.json();
        const open = Array.isArray(data)
          ? data.find((e: { clock_out: string | null }) => !e.clock_out)
          : null;
        setClockedIn(!!open);
        setClockInTime(open ? open.clock_in : null);
      }
    } finally {
      setClockCheckDone(true);
    }
  }, []);

  useEffect(() => {
    if (tutor) checkClockStatus();
    else {
      setClockCheckDone(true);
    }
  }, [tutor, checkClockStatus]);

  async function handleClock(action: "clock_in" | "clock_out") {
    if (!tutor) {
      toast.error("Open Profile to finish tutor setup before clocking in.");
      return;
    }
    setClockLoading(true);
    try {
      const res = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(action === "clock_in" ? "Clocked in!" : "Clocked out!");
      setClockedIn(action === "clock_in");
      if (action === "clock_in") {
        setClockInTime(new Date().toISOString());
      } else {
        setClockInTime(null);
      }
    } finally {
      setClockLoading(false);
    }
  }

  const isLongClockIn = clockInTime
    ? new Date().getTime() - new Date(clockInTime).getTime() >
      12 * 60 * 60 * 1000
    : false;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setLayout((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over!.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveLayout = async () => {
    setSavingLayout(true);
    try {
      const supabase = createClient();
      const baseLayout =
        ((profile as any)?.dashboard_layout as Record<string, unknown>) || {};
      const updatedLayout = { ...baseLayout, widgets: layout };
      const { error } = await supabase
        .from("profiles")
        .update({ dashboard_layout: updatedLayout })
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Dashboard layout saved!");
      setIsEditingLayout(false);
    } catch (err) {
      toast.error("Failed to save layout");
    } finally {
      setSavingLayout(false);
    }
  };

  const widgetsMap: Record<string, React.ReactNode> = {
    overdue:
      overdueSessions.length > 0 ? (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-warning/20 p-1.5">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-warning-foreground dark:text-warning">
                  Action Required: Uncompleted Sessions
                </p>
                <p className="text-sm text-muted-foreground">
                  You have {overdueSessions.length} past session
                  {overdueSessions.length > 1 ? "s" : ""} still marked as
                  "confirmed". Please mark them as completed or cancelled.
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-warning text-warning hover:bg-warning hover:text-warning-foreground shrink-0"
            >
              <Link href="/dashboard/sessions">Review Sessions</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null,

    clock_in:
      tutor && clockCheckDone ? (
        <Card
          className={`border-border/60 ${isLongClockIn ? "border-destructive/50 ring-1 ring-destructive/20" : ""}`}
        >
          <CardContent className="flex flex-col p-4 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${clockedIn ? (isLongClockIn ? "bg-destructive/10" : "bg-green-500/10") : "bg-muted"}`}
                >
                  <Timer
                    className={`h-5 w-5 ${clockedIn ? (isLongClockIn ? "text-destructive" : "text-green-600 dark:text-green-400") : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-medium ${clockedIn ? (isLongClockIn ? "text-destructive" : "text-green-600 dark:text-green-400") : "text-muted-foreground"}`}
                  >
                    {clockedIn ? "Currently Clocked In" : "Not Clocked In"}
                  </span>
                  <Link
                    href="/dashboard/timesheet"
                    className="text-xs text-primary hover:underline"
                  >
                    View timesheet
                  </Link>
                </div>
              </div>
              {clockedIn ? (
                <Button
                  onClick={() => handleClock("clock_out")}
                  disabled={clockLoading}
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {clockLoading ? "..." : "Clock Out"}
                </Button>
              ) : (
                <Button
                  onClick={() => handleClock("clock_in")}
                  disabled={clockLoading}
                  size="sm"
                  className="gap-2"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  {clockLoading ? "..." : "Clock In"}
                </Button>
              )}
            </div>
            {isLongClockIn && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                <p className="text-destructive font-medium">
                  You have been clocked in for over 12 hours. Please clock out
                  if you have finished your shift to prevent inaccurate
                  timesheets.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null,

    stats: (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">
                {stats.upcomingSessions}
              </span>
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
              <span className="text-2xl font-bold text-foreground">
                {stats.completedSessions}
              </span>
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
              <span className="text-2xl font-bold text-foreground">
                {stats.totalRatings}
              </span>
              <span className="text-xs text-muted-foreground">Reviews</span>
            </div>
          </CardContent>
        </Card>
      </div>
    ),

    upcoming_sessions: (
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Upcoming Sessions</CardTitle>
            <CardDescription>Sessions that need your attention</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link
              href="/dashboard/sessions"
              className="flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative flex items-center justify-center">
                <div className="absolute h-24 w-24 rounded-full bg-primary/5 blur-xl"></div>
                <div className="rounded-full border border-primary/20 bg-primary/10 p-4 shadow-sm">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="max-w-xs space-y-1">
                <h3 className="font-semibold tracking-tight text-foreground">
                  No upcoming sessions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your schedule is clear. Check back later or update your
                  availability.
                </p>
              </div>
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
                      {new Date(session.scheduled_date).toLocaleDateString(
                        "en-US",
                        { weekday: "short", month: "short", day: "numeric" },
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {session.start_time?.slice(0, 5)} -{" "}
                      {session.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.specializations && (
                      <Badge variant="secondary" className="text-xs">
                        {session.specializations.name}
                      </Badge>
                    )}
                    <Badge
                      className={SESSION_STATUS_COLORS[session.status] || ""}
                      variant="outline"
                    >
                      {session.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ),

    quick_actions: (
      <Card className="border-border/60 h-full">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Manage your tutoring</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            asChild
            variant="outline"
            className="justify-start h-auto py-3"
          >
            <Link
              href="/dashboard/timesheet"
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Timer className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">Timesheet</span>
                <span className="text-xs text-muted-foreground">
                  View clock-in history
                </span>
              </div>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="justify-start h-auto py-3"
          >
            <Link
              href="/dashboard/availability"
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">Manage Availability</span>
                <span className="text-xs text-muted-foreground">
                  Set your schedule
                </span>
              </div>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="justify-start h-auto py-3"
          >
            <Link
              href="/dashboard/sessions"
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                <Calendar className="h-4 w-4 text-success" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">View Sessions</span>
                <span className="text-xs text-muted-foreground">
                  Manage your bookings
                </span>
              </div>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="justify-start h-auto py-3"
          >
            <Link
              href="/dashboard/resources"
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/30">
                <FolderOpen className="h-4 w-4 text-accent-foreground" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">My Repositories</span>
                <span className="text-xs text-muted-foreground">
                  Share study materials
                </span>
              </div>
            </Link>
          </Button>
        </CardContent>
      </Card>
    ),
  };

  return (
    <div className="flex flex-col gap-6">
      {!tutor && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Finish your tutor setup
              </p>
              <p className="text-sm text-muted-foreground">
                You can use the app now. Add bio, specializations, and
                availability anytime from Profile.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/profile">
                <UserCircle className="mr-2 h-4 w-4" />
                Complete profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {profile?.full_name || "Tutor"}
          </h1>
          <p className="text-muted-foreground">
            Manage your sessions, resources, and availability.
          </p>
        </div>

        <div className="flex gap-2">
          {isEditingLayout ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditingLayout(false)}
              >
                Cancel
              </Button>
              <Button onClick={saveLayout} disabled={savingLayout}>
                Save Layout
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingLayout(true)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Customize Layout
            </Button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={layout} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-6">
            {layout.map((id) =>
              widgetsMap[id] ? (
                <SortableItem key={id} id={id} isEditing={isEditingLayout}>
                  {widgetsMap[id]}
                </SortableItem>
              ) : null,
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
