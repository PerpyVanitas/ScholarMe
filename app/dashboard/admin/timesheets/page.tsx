"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Timer, Clock, Users, Search } from "lucide-react";
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

interface TutorSummary {
  tutorId: string;
  name: string;
  email: string;
  totalMinutes: number;
  entries: number;
  isActive: boolean;
}

export default function AdminTimesheetsPage() {
  const { data: entries, isLoading } = useSWR<Timesheet[]>("/api/admin/timesheets", fetcher, { refreshInterval: 30000 });
  const [search, setSearch] = useState("");

  // Aggregate per tutor
  const tutorMap = new Map<string, TutorSummary>();
  for (const e of entries || []) {
    const tid = e.tutor_id;
    const profile = e.tutors?.profiles;
    const existing = tutorMap.get(tid);
    const mins = e.clock_out ? calcMinutes(e.clock_in, e.clock_out) : 0;
    if (existing) {
      existing.totalMinutes += mins;
      existing.entries += 1;
      if (!e.clock_out) existing.isActive = true;
    } else {
      tutorMap.set(tid, {
        tutorId: tid,
        name: profile?.full_name || "Unknown Tutor",
        email: profile?.email || "",
        totalMinutes: mins,
        entries: 1,
        isActive: !e.clock_out,
      });
    }
  }

  const tutors = Array.from(tutorMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  const filteredTutors = tutors.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEntries = (entries || []).filter((e) => {
    const name = e.tutors?.profiles?.full_name || "";
    const email = e.tutors?.profiles?.email || "";
    return name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
  });

  const totalOverall = tutors.reduce((sum, t) => sum + t.totalMinutes, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tutor Timesheets</h1>
        <p className="text-muted-foreground">View clock-in/out records for all tutors.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">{tutors.length}</span>
              <span className="text-xs text-muted-foreground">Tutors</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">{tutors.filter((t) => t.isActive).length}</span>
              <span className="text-xs text-muted-foreground">Currently Active</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/30">
              <Timer className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">{(totalOverall / 60).toFixed(1)}h</span>
              <span className="text-xs text-muted-foreground">Total Hours</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by tutor name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Per-Tutor Summary */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Tutor Summary</CardTitle>
          <CardDescription>Aggregated hours per tutor</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : filteredTutors.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="rounded-full bg-muted p-3"><Timer className="h-5 w-5 text-muted-foreground" /></div>
              <p className="text-sm text-muted-foreground">No timesheet data yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Tutor</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Entries</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Total Hours</th>
                    <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTutors.map((t) => (
                    <tr key={t.tutorId} className="border-b border-border/30">
                      <td className="py-3 pr-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{t.name}</span>
                          <span className="text-xs text-muted-foreground">{t.email}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-foreground">{t.entries}</td>
                      <td className="py-3 pr-4 font-mono text-foreground">{formatDuration(t.totalMinutes)}</td>
                      <td className="py-3">
                        {t.isActive ? (
                          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">Clocked In</Badge>
                        ) : (
                          <Badge variant="secondary">Offline</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Log */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">All Entries</CardTitle>
          <CardDescription>Complete clock-in/out log</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : filteredEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No entries found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Tutor</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Date</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Clock In</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Clock Out</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Duration</th>
                    <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => {
                    const mins = calcMinutes(entry.clock_in, entry.clock_out);
                    const profile = entry.tutors?.profiles;
                    return (
                      <tr key={entry.id} className="border-b border-border/30">
                        <td className="py-3 pr-4 text-foreground">{profile?.full_name || "Unknown"}</td>
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
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
