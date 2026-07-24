"use client";

import { useEffect, useState, useCallback } from "react";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LogIn,
  LogOut,
  Timer,
  Clock,
  CalendarDays,
  Loader2,
  Download,
  Coffee,
  AlertCircle,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

function calcMinutes(
  clockIn: string,
  clockOut: string | null,
  nowTime: number = Date.now(),
) {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : nowTime;
  return Math.max(0, (end - start) / 60000);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

function getWeekRange(offset: number = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  // Sunday (day=0) should map to the previous Monday (6 days back), not next Monday
  const daysToMonday = day === 0 ? -6 : 1 - day;
  monday.setDate(now.getDate() + daysToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

type FilterPeriod = "all" | "this_week" | "last_week" | "this_month";

export default function TimesheetPage() {
  const { data: config, isLoading: configLoading } = useSWR<{
    start_date: string | null;
    end_date: string | null;
  }>("/api/v1/timesheets/config", configFetcher);
  const {
    data: entries,
    mutate,
    isLoading,
  } = useSWR<Timesheet[]>("/api/v1/timesheets", fetcher, {
    refreshInterval: 10000,
  });
  const [clockLoading, setClockLoading] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionEntry, setCorrectionEntry] = useState<Timesheet | null>(
    null,
  );
  const [correctionTime, setCorrectionTime] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionLoading, setCorrectionLoading] = useState(false);

  // Sync timer to server clock_in rather than client boot
  const safeEntries = Array.isArray(entries) ? entries : [];
  const openEntry = safeEntries.find((e) => !e.clock_out);
  const isClockedIn = !!openEntry;

  // Timer: update every second when clocked in
  useEffect(() => {
    if (!isClockedIn) {
      return;
    }
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isClockedIn]);

  const hasConfig = config && config.start_date && config.end_date;
  const nowTime = now;
  const startTime = config?.start_date
    ? new Date(config.start_date).getTime()
    : 0;
  const endTime = config?.end_date ? new Date(config.end_date).getTime() : 0;
  const isPeriodActive =
    hasConfig && nowTime >= startTime && nowTime <= endTime;

  async function handleClock(
    action: "clock_in" | "clock_out" | "confirm_presence",
  ) {
    setClockLoading(true);
    let locationData = {};

    if (action === "clock_in" && "geolocation" in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
            });
          },
        );
        locationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          location_verified: true,
        };
      } catch (err) {
        toast.warning(
          "Location access denied or unavailable. Clocking in as unverified.",
        );
        locationData = { location_verified: false };
      }
    }

    try {
      const res = await fetch("/api/v1/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...locationData }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      if (action === "confirm_presence") {
        toast.success(
          "Facility presence confirmed! Your 2-hour session timer has been renewed.",
        );
      } else {
        toast.success(action === "clock_in" ? "Clocked in!" : "Clocked out!");
      }
      mutate();
    } finally {
      setClockLoading(false);
    }
  }

  // Filter entries by period
  const filteredEntries = safeEntries.filter((e) => {
    if (filterPeriod === "all") return true;
    const entryDate = new Date(e.clock_in);
    if (filterPeriod === "this_week") {
      const { start, end } = getWeekRange(0);
      return entryDate >= start && entryDate <= end;
    }
    if (filterPeriod === "last_week") {
      const { start, end } = getWeekRange(-1);
      return entryDate >= start && entryDate <= end;
    }
    if (filterPeriod === "this_month") {
      const now = new Date();
      return (
        entryDate.getMonth() === now.getMonth() &&
        entryDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  });

  const completedEntries = filteredEntries.filter((e) => e.clock_out);
  const totalMinutes = completedEntries.reduce(
    (sum, e) => sum + calcMinutes(e.clock_in, e.clock_out, now),
    0,
  );

  function exportCSV() {
    const rows = [
      ["Date", "Clock In", "Clock Out", "Duration (min)", "Status"],
      ...filteredEntries.map((e) => [
        fmtDate(e.clock_in),
        fmtTime(e.clock_in),
        e.clock_out ? fmtTime(e.clock_out) : "Active",
        e.clock_out
          ? Math.round(calcMinutes(e.clock_in, e.clock_out, now)).toString()
          : "—",
        e.clock_out ? "Completed" : "Active",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet_${filterPeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Timesheet exported!");
  }

  async function submitCorrection() {
    if (!correctionEntry || !correctionTime || !correctionReason.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setCorrectionLoading(true);
    try {
      const res = await fetch("/api/v1/timesheets/correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timesheet_id: correctionEntry.id,
          requested_clock_out: new Date(correctionTime).toISOString(),
          reason: correctionReason.trim(),
        }),
      });
      if (res.ok) {
        toast.success("Correction request submitted. An admin will review it.");
        setCorrectionOpen(false);
        setCorrectionEntry(null);
        setCorrectionTime("");
        setCorrectionReason("");
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to submit correction");
      }
    } finally {
      setCorrectionLoading(false);
    }
  }

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Timesheet
          </h1>
          <p className="text-muted-foreground">
            Track your clock-in and clock-out times.
          </p>
        </div>
        <Card className="border-border/60 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50 pointer-events-none" />
          <CardContent className="flex flex-col items-center justify-center text-center py-16 px-4 gap-4 relative z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse">
              <CalendarDays className="h-8 w-8" />
            </div>
            <div className="max-w-md flex flex-col gap-2">
              <h2 className="text-xl font-bold text-foreground">
                Timesheet Unavailable
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The administrator has not set a timesheet collection duration
                yet. You will be able to log your hours once a semester
                collection window is configured.
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Timesheet
          </h1>
          <p className="text-muted-foreground">
            Track your clock-in and clock-out times.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-primary/20 bg-primary/5 text-primary text-xs py-1 px-2.5"
        >
          Collection Period: {fmtDate(config.start_date!)} –{" "}
          {fmtDate(config.end_date!)}
        </Badge>
      </div>

      {/* Warning if outside bounds */}
      {!isPeriodActive && (
        <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg p-4 text-sm flex items-center gap-3">
          <CalendarDays className="h-5 w-5 shrink-0 animate-pulse" />
          <span>
            The timesheet collection window is currently closed. Logging hours
            is restricted to the period between{" "}
            <strong>{fmtDate(config.start_date!)}</strong> and{" "}
            <strong>{fmtDate(config.end_date!)}</strong>.
          </span>
        </div>
      )}

      {/* 12-hour Warning */}
      {isClockedIn &&
        openEntry &&
        calcMinutes(openEntry.clock_in, null, now) > 720 && (
          <div className="w-full bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>
              <strong>Warning:</strong> You have been clocked in for over 12
              hours. Please clock out or adjust your time to avoid payroll
              issues.
            </span>
          </div>
        )}

      {/* Presence Verification Dialog (Triggers at 110+ minutes of unconfirmed activity) */}
      <Dialog
        open={
          isClockedIn &&
          !!openEntry &&
          calcMinutes(
            openEntry.last_confirmed_at || openEntry.clock_in,
            null,
            now,
          ) >= 110
        }
        onOpenChange={() => {}}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
              Facility Presence Verification
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-relaxed">
              You have been clocked in for over 1 hour and 50 minutes. To avoid
              being automatically clocked out after 2 hours, please confirm that
              you are still working at the facility.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 flex flex-col items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Auto Clock-Out Countdown
            </span>
            <span className="mt-1 font-mono text-3xl font-bold text-foreground">
              {Math.max(
                0,
                Math.floor(
                  (120 -
                    calcMinutes(
                      openEntry?.last_confirmed_at ||
                        openEntry?.clock_in ||
                        new Date().toISOString(),
                      null,
                      now,
                    )) *
                    60,
                ),
              )}
              s remaining
            </span>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => handleClock("clock_out")}
              disabled={clockLoading}
            >
              Clock Out Now
            </Button>
            <Button
              onClick={() => handleClock("confirm_presence")}
              disabled={clockLoading}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {clockLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Yes, I&apos;m Still Here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clock In/Out Card */}
      <Card className="border-border/60">
        <CardContent className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${isClockedIn ? "bg-green-500/10" : "bg-muted"}`}
            >
              <Timer
                className={`h-7 w-7 ${isClockedIn ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
              />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-lg font-semibold ${isClockedIn ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
              >
                {isClockedIn ? "Currently Clocked In" : "Not Clocked In"}
              </span>
              {isClockedIn && openEntry && (
                <span className="text-sm text-muted-foreground font-mono">
                  Elapsed:{" "}
                  {formatDuration(calcMinutes(openEntry.clock_in, null, now))}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isClockedIn ? (
              <>
                <Button
                  onClick={() => handleClock("clock_out")}
                  disabled={clockLoading}
                  variant="destructive"
                  size="lg"
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {clockLoading ? "Processing..." : "Clock Out"}
                </Button>
              </>
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
          </div>
        </CardContent>
      </Card>

      {/* Summary — single consolidated card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">
                {completedEntries.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {filterPeriod === "all"
                  ? "Semester"
                  : filterPeriod.replace("_", " ")}{" "}
                Entries
              </span>
            </div>
          </CardContent>
        </Card>
        {/* Unified time card (#51) */}
        <Card className="border-border/60 sm:col-span-2">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Clock className="h-5 w-5 text-success" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">
                {formatDuration(totalMinutes)}
              </span>
              <span className="text-xs text-muted-foreground">
                Total time logged ({(totalMinutes / 60).toFixed(1)}h)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">History</CardTitle>
              <CardDescription>
                Clock records for the current active period
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Period filter */}
              <Select
                value={filterPeriod}
                onValueChange={(v) => setFilterPeriod(v as FilterPeriod)}
              >
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entries</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                </SelectContent>
              </Select>
              {/* Export */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={exportCSV}
              >
                <Download className="h-3 w-3" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </p>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <Timer className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No timesheet entries for this period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Clock In
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Clock Out
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Duration
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => {
                    const mins = calcMinutes(
                      entry.clock_in,
                      entry.clock_out,
                      now,
                    );
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
                        <td className="py-3 pr-4 font-mono text-foreground">
                          {formatDuration(mins)}
                        </td>
                        <td className="py-3 pr-4">
                          {entry.clock_out ? (
                            <Badge variant="secondary">Completed</Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="py-3">
                          {/* Request correction button for completed entries or stuck-open entries */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                            onClick={() => {
                              setCorrectionEntry(entry);
                              setCorrectionTime(
                                entry.clock_out
                                  ? new Date(entry.clock_out)
                                      .toISOString()
                                      .slice(0, 16)
                                  : new Date().toISOString().slice(0, 16),
                              );
                              setCorrectionOpen(true);
                            }}
                          >
                            <AlertCircle className="h-3 w-3" />
                            Correct
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {completedEntries.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border font-semibold">
                      <td colSpan={3} className="py-3 pr-4 text-foreground">
                        Running Total
                      </td>
                      <td className="py-3 pr-4 font-mono text-foreground">
                        {formatDuration(totalMinutes)} (
                        {(totalMinutes / 60).toFixed(1)}h)
                      </td>
                      <td />
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Correction Request Dialog (#114) */}
      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Request Time Correction
            </DialogTitle>
            <DialogDescription>
              Submit a correction request for admin review. The admin will
              approve or reject the change.
            </DialogDescription>
          </DialogHeader>
          {correctionEntry && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted rounded-md text-sm">
                <p className="text-muted-foreground">
                  Entry: {fmtDate(correctionEntry.clock_in)} — Clock In at{" "}
                  {fmtTime(correctionEntry.clock_in)}
                </p>
                <p className="text-muted-foreground">
                  Current Clock Out:{" "}
                  {correctionEntry.clock_out ? (
                    fmtTime(correctionEntry.clock_out)
                  ) : (
                    <span className="text-amber-500">Missing (Active)</span>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="correction-time">Correct Clock-Out Time</Label>
                <Input
                  id="correction-time"
                  type="datetime-local"
                  value={correctionTime}
                  onChange={(e) => setCorrectionTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="correction-reason">
                  Reason for Correction *
                </Label>
                <Textarea
                  id="correction-reason"
                  placeholder="e.g. Forgot to clock out before leaving on Friday..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCorrection} disabled={correctionLoading}>
              {correctionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
