// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Timer,
  Clock,
  Users,
  Search,
  CalendarDays,
  Loader2,
  Play,
  Square,
  Trash2,
  Eye,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import type { Timesheet } from "@/lib/types";
import { ExportCsvButton } from "@/components/export-csv-button";

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

import {
  TutorSummaryTable,
  AllEntriesTable,
  TutorSummary,
  calcMinutes,
  fmtDate,
  fmtTime,
  formatDuration
} from "./components/timesheets-table";

export default function AdminTimesheetsPage() {
  const {
    data: config,
    mutate: mutateConfig,
    isLoading: configLoading,
  } = useSWR<{
    id: string | null;
    name: string | null;
    start_date: string | null;
    end_date: string | null;
  }>("/api/timesheets/config", configFetcher);
  const {
    data: periods,
    mutate: mutatePeriods,
    isLoading: periodsLoading,
  } = useSWR<unknown[]>("/api/timesheets/periods", fetcher);
  const {
    data: entries,
    mutate: mutateEntries,
    isLoading,
  } = useSWR<Timesheet[]>("/api/admin/timesheets", fetcher, {
    refreshInterval: 30000,
  });

  // Modal Details View
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detailPeriod, setDetailPeriod] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [modalSearch, setModalSearch] = useState("");

  const { data: modalEntries, isLoading: modalEntriesLoading } = useSWR<
    Timesheet[]
  >(
    detailPeriod
      ? `/api/admin/timesheets?start_date=${detailPeriod.start_date}&end_date=${detailPeriod.end_date}`
      : null,
    fetcher,
  );

  // Aggregate current period data per tutor
  const safeEntries = Array.isArray(entries) ? entries : [];
  const tutorMap = new Map<string, TutorSummary>();
  for (const e of safeEntries) {
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

  const tutors = Array.from(tutorMap.values()).sort(
    (a, b) => b.totalMinutes - a.totalMinutes,
  );
  const filteredTutors = tutors.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredEntries = safeEntries.filter((e) => {
    const name = e.tutors?.profiles?.full_name || "";
    const email = e.tutors?.profiles?.email || "";
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalOverall = tutors.reduce((sum, t) => sum + t.totalMinutes, 0);

  // Aggregate modal period data per tutor
  const safeModalEntries = Array.isArray(modalEntries) ? modalEntries : [];
  const modalTutorMap = new Map<string, TutorSummary>();
  for (const e of safeModalEntries) {
    const tid = e.tutor_id;
    const profile = e.tutors?.profiles;
    const existing = modalTutorMap.get(tid);
    const mins = e.clock_out ? calcMinutes(e.clock_in, e.clock_out) : 0;
    if (existing) {
      existing.totalMinutes += mins;
      existing.entries += 1;
      if (!e.clock_out) existing.isActive = true;
    } else {
      modalTutorMap.set(tid, {
        tutorId: tid,
        name: profile?.full_name || "Unknown Tutor",
        email: profile?.email || "",
        totalMinutes: mins,
        entries: 1,
        isActive: !e.clock_out,
      });
    }
  }

  const modalTutors = Array.from(modalTutorMap.values()).sort(
    (a, b) => b.totalMinutes - a.totalMinutes,
  );
  const modalTotalOverall = modalTutors.reduce(
    (sum, t) => sum + t.totalMinutes,
    0,
  );

  const filteredModalEntries = safeModalEntries.filter((e) => {
    const name = e.tutors?.profiles?.full_name || "";
    const email = e.tutors?.profiles?.email || "";
    return (
      name.toLowerCase().includes(modalSearch.toLowerCase()) ||
      email.toLowerCase().includes(modalSearch.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tutor Timesheets
          </h1>
          <p className="text-muted-foreground">
            View and manage timesheet records and semester configurations.
          </p>
        </div>
        <div>
          {configLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : config && config.start_date && config.end_date ? (
            <Badge
              variant="outline"
              className="border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-400 py-1 px-3"
            >
              Active Period: {config.name || "Semester"} (
              {fmtDate(config.start_date!)} – {fmtDate(config.end_date!)})
            </Badge>
          ) : (
            <Badge variant="destructive" className="py-1 px-3">
              Collection Period: Not Configured
            </Badge>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {/* Collection History List */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              Collection History
            </CardTitle>
            <CardDescription>
              Inspect historical logs. Semester activity configurations are
              managed in the{" "}
              <strong className="text-foreground">Analytics</strong> tab.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {periodsLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading periods...
              </p>
            ) : !periods || periods.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No periods configured yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left">
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">
                        Semester Name
                      </th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">
                        Duration
                      </th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((p) => (
                      // @ts-ignore: Strict unknown type check
                      <tr key={p.id} className="border-b border-border/30">
                        <td className="py-3 pr-4 font-medium text-foreground">
                          // @ts-ignore: Strict unknown type check
                          {p.name}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs font-mono">
                          // @ts-ignore: Strict unknown type check
                          {fmtDate(p.start_date)} – {fmtDate(p.end_date)}
                        </td>
                        <td className="py-3 pr-4">
                          // @ts-ignore: Strict unknown type check
                          {p.is_active ? (
                            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => setDetailPeriod(p)}
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Inspect
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* active period statistics summary */}
      {config && config.start_date && config.end_date && (
        <>
          <div className="flex flex-col gap-1 mt-2">
            <h2 className="text-lg font-semibold text-foreground">
              Current Active Period Analytics
            </h2>
            <p className="text-xs text-muted-foreground">
              Aggregations matching {config.name || "the active semester"}
            </p>
          </div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-border/60">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground">
                    {tutors.length}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Tutors Logging Hours
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground">
                    {tutors.filter((t) => t.isActive).length}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Currently Active
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/30">
                  <Timer className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground">
                    {(totalOverall / 60).toFixed(1)}h
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Semester Hours Total
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search + Export */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by tutor name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ExportCsvButton
              data={filteredTutors.map((t) => ({
                Name: t.name,
                Email: t.email,
                Entries: t.entries,
                "Total Minutes": Math.round(t.totalMinutes),
                "Total Hours": (t.totalMinutes / 60).toFixed(2),
                Status: t.isActive ? "Active" : "Completed",
              }))}
              filename={`timesheets_${config?.name ?? "semester"}`}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              title="Print timesheet report"
            >
              <Printer className="mr-2 h-3.5 w-3.5" />
              Print
            </Button>
          </div>

          {/* Per-Tutor Summary */}
          <TutorSummaryTable isLoading={isLoading} filteredTutors={filteredTutors} />

          {/* Full Log */}
          <AllEntriesTable isLoading={isLoading} filteredEntries={filteredEntries} />
        </>
      )}

      {/* History Inspection Modal */}
      <Dialog
        open={!!detailPeriod}
        onOpenChange={(open) => {
          if (!open) setDetailPeriod(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {detailPeriod?.name || "Period Details"}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Configured: {detailPeriod && fmtDate(detailPeriod.start_date)} –{" "}
              {detailPeriod && fmtDate(detailPeriod.end_date)}
            </DialogDescription>
          </DialogHeader>

          {modalEntriesLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Modal stats cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="border-border/60 bg-muted/10">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-foreground">
                        {modalTutors.length}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        Tutors Active
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-muted/10">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15">
                      <Clock className="h-5 w-5 text-success animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-foreground">
                        {safeModalEntries.length}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        Total Entries
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-muted/10">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/25">
                      <Timer className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-foreground">
                        {(modalTotalOverall / 60).toFixed(1)}h
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        Total Duration
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Modal Search Log */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-foreground">
                    Semester Log Records
                  </h3>
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Filter by tutor name/email..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-background"
                    />
                  </div>
                </div>

                {filteredModalEntries.length === 0 ? (
                  <p className="text-center text-sm py-8 text-muted-foreground">
                    No logs found matching search criteria.
                  </p>
                ) : (
                  <div className="overflow-x-auto border rounded-lg max-h-[40vh] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 sticky top-0">
                        <tr className="border-b text-left">
                          <th className="p-3 font-medium text-muted-foreground">
                            Tutor
                          </th>
                          <th className="p-3 font-medium text-muted-foreground">
                            Date
                          </th>
                          <th className="p-3 font-medium text-muted-foreground">
                            Clock In
                          </th>
                          <th className="p-3 font-medium text-muted-foreground">
                            Clock Out
                          </th>
                          <th className="p-3 font-medium text-muted-foreground">
                            Duration
                          </th>
                          <th className="p-3 font-medium text-muted-foreground">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredModalEntries.map((entry) => {
                          const mins = calcMinutes(
                            entry.clock_in,
                            entry.clock_out,
                          );
                          const profile = entry.tutors?.profiles;
                          return (
                            <tr
                              key={entry.id}
                              className="border-b last:border-0 hover:bg-muted/10"
                            >
                              <td className="p-3">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-foreground">
                                    {profile?.full_name || "Unknown"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {profile?.email || ""}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-foreground">
                                {fmtDate(entry.clock_in)}
                              </td>
                              <td className="p-3 font-mono">
                                {fmtTime(entry.clock_in)}
                              </td>
                              <td className="p-3 font-mono">
                                {entry.clock_out
                                  ? fmtTime(entry.clock_out)
                                  : "--:--"}
                              </td>
                              <td className="p-3 font-mono">
                                {formatDuration(mins)}
                              </td>
                              <td className="p-3">
                                {entry.clock_out ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] py-0 px-1"
                                  >
                                    Completed
                                  </Badge>
                                ) : (
                                  <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-[10px] py-0 px-1">
                                    Active
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
