"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut, Timer, Clock, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Timesheet } from "@/lib/types";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to fetch: ${r.status}`);
  const data = await r.json();
  return Array.isArray(data) ? data : [];
};

const configFetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to fetch: ${r.status}`);
  return await r.json();
};

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function calcMinutes(clockIn: string, clockOut: string | null, nowTime: number = Date.now()) {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : nowTime;
  return Math.max(0, (end - start) / 60000);
}

function fmtDate(d: string) {
  const dt = new Date(d);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
}

function fmtTime(d: string) {
  const dt = new Date(d);
  const h = dt.getUTCHours();
  const m = dt.getUTCMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${(h % 12) || 12}:${m} ${ampm}`;
}

export default function TimesheetPage() {
  const { data: config, isLoading: configLoading } = useSWR<{ start_date: string | null; end_date: string | null }>("/api/timesheets/config", configFetcher);
  const { data: entries, mutate, isLoading } = useSWR<Timesheet[]>("/api/timesheets", fetcher, { refreshInterval: 5000 });
  const [clockLoading, setClockLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  const safeEntries = Array.isArray(entries) ? entries : [];
  const openEntry = safeEntries.find((e) => !e.clock_out);
  const isClockedIn = !!openEntry;

  // Calculate server time offset on mount and when entries change
  useEffect(() => {
    if (openEntry) {
      // Use server clock_in time to calculate offset
      const serverTime = new Date(openEntry.clock_in).getTime();
      const clientTime = Date.now();
      // Don't set offset if it's too far off (more than 5 seconds)
      const diff = Math.abs(clientTime - serverTime);
      if (diff < 5000) {
        setServerTimeOffset(serverTime - clientTime + 1000); // Add 1s since we just clocked in
      }
    }
  }, [openEntry]);

  // Live timer tick every second when clocked in (synchronized with server)
  useEffect(() => {
    if (!isClockedIn) return;
    const t = setInterval(() => {
      setNow(Date.now());
    }, 1000);
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

  const completedEntries = safeEntries.filter((e) => e.clock_out);
  const totalMinutes = completedEntries.reduce((sum, e) => sum + calcMinutes(e.clock_in, e.clock_out, now), 0);
  const totalHours = totalMinutes / 60;

  const hasConfig = config && config.start_date && config.end_date;
  const nowTime = Date.now();
  const startTime = config?.start_date ? new Date(config.start_date).getTime() : 0;
  const endTime = config?.end_date ? new Date(config.end_date).getTime() : 0;
  const isPeriodActive = hasConfig && nowTime >= startTime && nowTime <= endTime;

  if (configLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasConfig) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Timesheet</h1>
          <p className="text-muted-foreground">Track your clock-in and clock-out times.</p>
        </div>
        <Card className="border-border/60 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50 pointer-events-none" />
          <CardContent className="flex flex-col items-center justify-center text-center py-16 px-4 gap-4 relative z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse">
              <CalendarDays className="h-8 w-8" />
            </div>
            <div className="max-w-md flex flex-col gap-2">
              <h2 className="text-xl font-bold text-foreground">Timesheet Unavailable</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The administrator has not set a timesheet collection duration yet. You will be able to log your hours once a semester collection window is configured.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Timesheet</h1>
          <p className="text-muted-foreground">Track your clock-in and clock-out times.</p>
        </div>
        <Badge variant="outline" className="w-fit border-primary/20 bg-primary/5 text-primary text-xs py-1 px-2.5">
          Collection Period: {fmtDate(config.start_date!)} – {fmtDate(config.end_date!)}
        </Badge>
      </div>

      {/* Warning if today is outside bounds */}
      {!isPeriodActive && (
        <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg p-4 text-sm flex items-center gap-3">
          <CalendarDays className="h-5 w-5 shrink-0 animate-pulse" />
          <span>
            The timesheet collection window is currently closed. Logging hours is restricted to the period between <strong>{fmtDate(config.start_date!)}</strong> and <strong>{fmtDate(config.end_date!)}</strong>.
          </span>
        </div>
      )}

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
                  Elapsed: {formatDuration(calcMinutes(openEntry.clock_in, null, now))}
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
            <Button 
              onClick={() => handleClock("clock_in")} 
              disabled={clockLoading || !isPeriodActive} 
              size="lg" 
              className="gap-2"
            >
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
              <span className="text-xs text-muted-foreground">Semester Entries</span>
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
              <span className="text-xs text-muted-foreground">Semester Minutes</span>
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
              <span className="text-xs text-muted-foreground">Semester Hours</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timesheet Table */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
          <CardDescription>Clock records for the current active period</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : safeEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="rounded-full bg-muted p-3"><Timer className="h-5 w-5 text-muted-foreground" /></div>
              <p className="text-sm text-muted-foreground">No timesheet entries recorded for this active period.</p>
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
                  {safeEntries.map((entry) => {
                    const mins = calcMinutes(entry.clock_in, entry.clock_out, now);
                    return (
                      <tr key={entry.id} className="border-b border-border/30">
                        <td className="py-3 pr-4 text-foreground">
                          {fmtDate(entry.clock_in)}
                        </td>
                        <td className="py-3 pr-4 font-mono text-foreground">
                          {fmtTime(entry.clock_in)}
                        </td>
                        <td className="py-3 pr-4 font-mono text-foreground">
                          {entry.clock_out ? fmtTime(entry.clock_out) : "--:--"}
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
