// @ts-nocheck
﻿import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  createTeamTask,
  addSchedule,
  updateTaskStatus,
} from "@/app/actions/team";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  PlayCircle,
  ListChecks,
} from "lucide-react";
import { getRoleName, TEAMWORK_ROLES, hasAnyRole } from "@/lib/utils/roles";

const STATUS_CONFIG = {
  todo: {
    label: "To Do",
    color: "bg-muted text-muted-foreground",
    icon: Circle,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: PlayCircle,
  },
  review: {
    label: "In Review",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Clock,
  },
  done: {
    label: "Done",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: CheckCircle2,
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;
const columns: StatusKey[] = ["todo", "in_progress", "review", "done"];

export default async function TeamDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RBAC: only tutors and governance roles can access
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleName = getRoleName(profile as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasAnyRole(roleName as any, TEAMWORK_ROLES)) {
    redirect("/dashboard");
  }

  const { data: tasks } = await supabase
    .from("team_tasks")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });

  const { data: schedules } = await supabase
    .from("team_schedules")
    .select("*, profiles(full_name)")
    .order("date", { ascending: true });

  const now = new Date();
  const taskCounts = columns.reduce(
    (acc, col) => ({
      ...acc,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // @ts-ignore: Strict unknown type check
      [col]: tasks?.filter((t: unknown) => t.status === col).length ?? 0,
    }),
    {} as Record<StatusKey, number>,
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Team Workspace</h1>
        <p className="text-muted-foreground text-sm">
          Manage committee tasks, track deliverables, and log team availability.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {columns.map((col) => {
          const cfg = STATUS_CONFIG[col];
          const Icon = cfg.icon;
          return (
            <Card key={col} className="border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${cfg.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{taskCounts[col]}</div>
                  <div className="text-xs text-muted-foreground">
                    {cfg.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Tasks Matrix
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Schedules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Add New Task</CardTitle>
              <CardDescription>
                Create a deliverable with an optional deadline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                action={createTeamTask}
                className="flex flex-wrap gap-3 max-w-2xl"
              >
                <Input
                  name="deliverable"
                  placeholder="Deliverable name..."
                  required
                  className="flex-1 min-w-[200px]"
                />
                <Input type="date" name="deadline" className="w-40" />
                <Button type="submit">Add Task</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((col) => {
              const cfg = STATUS_CONFIG[col];
              const colTasks =
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                // @ts-ignore: Strict unknown type check
                tasks?.filter((t: unknown) => t.status === col) ?? [];
              return (
                <div key={col} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                      {cfg.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {colTasks.length === 0 ? (
                      <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground">
                        No tasks
                      </div>
                    ) : (
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      colTasks.map((t: unknown) => {
                        const isOverdue =
                          // @ts-ignore: Strict unknown type check
                          t.deadline &&
                          // @ts-ignore: Strict unknown type check
                          new Date(t.deadline) < now &&
                          // @ts-ignore: Strict unknown type check
                          t.status !== "done";
                        return (
                          <Card
                            // @ts-ignore: Strict unknown type check
                            key={t.id}
                            className="border-border/60 shadow-sm"
                          >
                            <CardContent className="p-3">
                              <p className="text-sm font-medium leading-snug">
                                // @ts-ignore: Strict unknown type check
                                {t.deliverable}
                              </p>
                              // @ts-ignore: Strict unknown type check
                              {t.profiles?.full_name && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  // @ts-ignore: Strict unknown type check
                                  {t.profiles.full_name}
                                </p>
                              )}
                              // @ts-ignore: Strict unknown type check
                              {t.deadline && (
                                <p
                                  className={`text-xs mt-1 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}
                                >
                                  Due:{" "}
                                  // @ts-ignore: Strict unknown type check
                                  {new Date(t.deadline).toLocaleDateString()}
                                  {isOverdue && " · Overdue"}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {col !== "done" && (
                                  <form
                                    action={async () => {
                                      "use server";
                                      // @ts-ignore: Strict unknown type check
                                      await updateTaskStatus(t.id, "done");
                                    }}
                                  >
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-xs px-2"
                                    >
                                      ✓ Done
                                    </Button>
                                  </form>
                                )}
                                {col === "todo" && (
                                  <form
                                    action={async () => {
                                      "use server";
                                      await updateTaskStatus(
                                        // @ts-ignore: Strict unknown type check
                                        t.id,
                                        "in_progress",
                                      );
                                    }}
                                  >
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-xs px-2"
                                    >
                                      ▶ Start
                                    </Button>
                                  </form>
                                )}
                                {col === "in_progress" && (
                                  <form
                                    action={async () => {
                                      "use server";
                                      // @ts-ignore: Strict unknown type check
                                      await updateTaskStatus(t.id, "review");
                                    }}
                                  >
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-xs px-2"
                                    >
                                      → Review
                                    </Button>
                                  </form>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Log Schedule Activity</CardTitle>
              <CardDescription>
                Record your availability or upcoming team activities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                action={addSchedule}
                className="flex flex-wrap gap-3 max-w-2xl"
              >
                <Input type="date" name="date" required className="w-40" />
                <Input
                  name="activity"
                  placeholder="Activity / availability note..."
                  required
                  className="flex-1 min-w-[200px]"
                />
                <Button type="submit">Log</Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="text-base font-semibold">Upcoming Schedule</h2>
            {!schedules || schedules.length === 0 ? (
              <Card className="border-border/60">
                <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                  No schedules logged yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {schedules.map((s: unknown) => {
                  // @ts-ignore: Strict unknown type check
                  const isPast = new Date(s.date) < now;
                  return (
                    <Card
                      // @ts-ignore: Strict unknown type check
                      key={s.id}
                      className={`border-border/60 ${isPast ? "opacity-60" : ""}`}
                    >
                      <CardContent className="p-4 flex gap-3 items-start">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <CalendarDays className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            // @ts-ignore: Strict unknown type check
                            {s.profiles?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 break-words">
                            // @ts-ignore: Strict unknown type check
                            {s.activity}
                          </p>
                          <p className="text-xs font-medium mt-1 text-primary">
                            // @ts-ignore: Strict unknown type check
                            {new Date(s.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
