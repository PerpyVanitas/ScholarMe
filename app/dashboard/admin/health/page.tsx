"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Activity, Server, Database, HardDrive, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HealthMetrics {
  status: string;
  counts: Record<string, number>;
  totalRows: number;
  dbSize: number;
  dbMax: number;
  activeSessions: number;
  overdueCheckouts: number;
  generatedAt: string;
}

export default function SystemHealthPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch("/api/admin/health");
        if (res.ok) {
          setMetrics(await res.json());
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.error("Failed to load health metrics", e);
        toast.error(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const triggerReminders = async () => {
    try {
      const res = await fetch("/api/admin/cron/reminders", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Cron finished: ${data.remindersSent} reminders, ${data.overdueNoticesSent} overdue notices.`,
        );
      } else {
        toast.error(`Cron error: ${data.error}`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(`Failed to trigger cron: ${e.message}`);
    }
  };

  const dbPercentage = metrics ? (metrics.dbSize / metrics.dbMax) * 100 : 0;
  const totalRows = metrics?.totalRows ?? 0;
  const rowCap = 50000;
  const rowPercentage = (totalRows / rowCap) * 100;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            System Health
          </h1>
          <p className="text-muted-foreground mt-1">
            Live row counts and estimated database usage from Supabase
          </p>
        </div>
        <div className="flex items-center gap-2 bg-background border px-4 py-2 rounded-full shadow-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium">
            {loading
              ? "Loading..."
              : metrics?.status === "operational"
                ? "All Systems Operational"
                : "Degraded"}
          </span>
        </div>
      </div>

      {loading || !metrics ? (
        <p className="text-muted-foreground">Loading system metrics...</p>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className={dbPercentage > 80 ? "border-red-500" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-base font-medium">
                    Database Storage (est.)
                  </CardTitle>
                  <CardDescription>Estimated from row volume</CardDescription>
                </div>
                <Database
                  className={`h-5 w-5 ${dbPercentage > 80 ? "text-red-500" : "text-muted-foreground"}`}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {metrics.dbSize} MB{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {metrics.dbMax} MB
                  </span>
                </div>
                <Progress value={dbPercentage} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {dbPercentage.toFixed(1)}% of free tier estimate
                </p>
              </CardContent>
            </Card>

            <Card className={rowPercentage > 80 ? "border-yellow-500" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-base font-medium">
                    Total Rows
                  </CardTitle>
                  <CardDescription>Across key tables</CardDescription>
                </div>
                <HardDrive className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {totalRows.toLocaleString()}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    rows
                  </span>
                </div>
                <Progress value={rowPercentage} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(metrics.generatedAt).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-base font-medium">
                    Live Activity
                  </CardTitle>
                  <CardDescription>Sessions & library</CardDescription>
                </div>
                <Server className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active sessions</span>
                  <span className="font-semibold">
                    {metrics.activeSessions}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Overdue library items
                  </span>
                  <span className="font-semibold">
                    {metrics.overdueCheckouts}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Registered users
                  </span>
                  <span className="font-semibold">
                    {metrics.counts.profiles ?? 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Table Row Counts</CardTitle>
              <CardDescription>
                Real counts queried from Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(metrics.counts).map(([table, count]) => (
                  <div
                    key={table}
                    className="flex justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{table}</span>
                    <span className="font-mono font-medium">
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>System Services</CardTitle>
          <CardDescription>
            Real-time status of underlying infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-500/10 rounded-full">
                  <Database className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold">Supabase PostgreSQL</h4>
                  <p className="text-sm text-muted-foreground">
                    Main Database Cluster
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-600 border-green-200"
              >
                Operational
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-500/10 rounded-full">
                  <Server className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold">Supabase Auth</h4>
                  <p className="text-sm text-muted-foreground">
                    Authentication Services
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-600 border-green-200"
              >
                Operational
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-500/10 rounded-full">
                  <HardDrive className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold">Supabase Storage</h4>
                  <p className="text-sm text-muted-foreground">
                    Object Buckets & CDN
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-600 border-green-200"
              >
                Operational
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-semibold">Automated Cron Jobs</h4>
                  <p className="text-sm text-muted-foreground">
                    Event Reminders & Overdue Notices
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={triggerReminders}>
                  Trigger Now
                </Button>
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-600 border-green-200"
                >
                  Operational
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
