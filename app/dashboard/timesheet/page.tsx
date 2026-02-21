"use client";

import { useEffect, useState, useCallback } from "react";
import useSWR from "swr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut, Timer, Clock, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import type { Timesheet } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function calcMinutes(clockIn: string, clockOut: string | null) {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  return Math.max(0, (end - start) / 60000);
}

export default function TimesheetPage() {
  const { data: entries, mutate, isLoading } = useSWR<Timesheet[]>("/api/timesheets", fetcher, { refreshInterval: 30000 });
  const [clockLoading, setClockLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  const openEntry = entries?.find((e) => !e.clock_out);
  const isClockedIn = !!openEntry;

  // Live timer tick every second when clocked in
  useEffect(() => {
    if (!isClockedIn) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isClockedIn]);

  async function handleClock(action: "clock_in" | "clock_out") {
    setClockLoading(true);
    try {
      const res = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(action === "clock_in" ? "Clocked in!" : "Clocked out!");
      mutate();
    } finally {
      setClockLoading(false);
    }
  }

  const completedEntries = entries?.filter((e) => e.clock_out) || [];
  const totalMinutes = completedEntries.reduce((sum, e) => sum + calcMinutes(e.clock_in, e.clock_out), 0);
  const totalHours = totalMinutes / 60;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Timesheet</h1>
        <p className="text-muted-foreground">Track your clock-in and clock-out times.</p>
      </div>

      {/* Clock In/Out Card */}
      <Card className="border-border/60">
        <CardContent className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${isClockedIn ? "bg-green-500/10" : "bg-muted"}`}>
              <Timer className={`h-7 w-7 ${isClockedIn ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`} />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-semibold ${isClockedIn ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                {isClockedIn ? "Currently Clocked In" : "Not Clocked In"}
              </span>
              {isClockedIn && openEntry && (
                <span className="text-sm text-muted-foreground font-mono">
                  Elapsed: {formatDuration(calcMinutes(openEntry.clock_in, null))}
                </span>
              )}
            </div>
          </div>
          {isClockedIn ? (
            <Button onClick={() => handleClock("clock_out")} disabled={clockLoading} variant="destructive" size="lg" className="gap-2">
              <LogOut className="h-4 w-4" />
              {clockLoading ? "Processing..." : "Clock Out"}
            </Button>
          ) : (
            <Button onClick={() => handleClock("clock_in")} disabled={clockLoading} size="lg" className="gap-2">
              <LogIn className="h-4 w-4" />
              {clockLoading ? "Processing..." : "Clock In"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">{completedEntries.length}</span>
              <span className="text-xs text-muted-foreground">Total Entries</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Clock className="h-5 w-5 text-success" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">{Math.round(totalMinutes)}</span>
              <span className="text-xs text-muted-foreground">Total Minutes</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/30">
              <Timer className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">{totalHours.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">Total Hours</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timesheet Table */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
          <CardDescription>All your clock-in and clock-out records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : !entries || entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="rounded-full bg-muted p-3"><Timer className="h-5 w-5 text-muted-foreground" /></div>
              <p className="text-sm text-muted-foreground">No timesheet entries yet. Clock in to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Date</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Clock In</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Clock Out</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Duration</th>
                    <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const mins = calcMinutes(entry.clock_in, entry.clock_out);
                    return (
                      <tr key={entry.id} className="border-b border-border/30">
                        <td className="py-3 pr-4 text-foreground">
                          {new Date(entry.clock_in).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 pr-4 font-mono text-foreground">
                          {new Date(entry.clock_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3 pr-4 font-mono text-foreground">
                          {entry.clock_out
                            ? new Date(entry.clock_out).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                            : "--:--"}
                        </td>
                        <td className="py-3 pr-4 font-mono text-foreground">{formatDuration(mins)}</td>
                        <td className="py-3">
                          {entry.clock_out ? (
                            <Badge variant="secondary">Completed</Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">Active</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {completedEntries.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border font-semibold">
                      <td colSpan={3} className="py-3 pr-4 text-foreground">Running Total</td>
                      <td className="py-3 pr-4 font-mono text-foreground">{formatDuration(totalMinutes)} ({totalHours.toFixed(1)}h)</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
