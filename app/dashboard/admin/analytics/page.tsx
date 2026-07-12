"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Calendar,
  ShieldPlus,
  Loader2,
  Trophy,
  Medal,
  Star,
  DownloadCloud,
  FileText,
  Activity,
  Globe,
  Server,
  GraduationCap,
  BookOpen,
  CreditCard,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from "recharts";
import { ExportCsvButton } from "@/components/export-csv-button";

import dynamic from "next/dynamic";

const TutorAnalyticsTab = dynamic(
  () =>
    import("./components/tutor-analytics-tab").then(
      (mod) => mod.TutorAnalyticsTab,
    ),
  { ssr: false },
);

const SystemAnalyticsTab = dynamic(
  () =>
    import("./components/system-analytics-tab").then(
      (mod) => mod.SystemAnalyticsTab,
    ),
  { ssr: false },
);

import { GeneralAnalyticsTab } from "./components/general-analytics-tab";
import { HallOfFameTab } from "./components/hall-of-fame-tab";

const CHART_COLORS = [
  "oklch(0.5 0.02 255)", // primary
  "oklch(0.6 0.1 140)", // success
  "oklch(0.65 0.15 40)", // destructive
  "oklch(0.7 0.15 80)", // warning
  "oklch(0.4 0.1 200)", // accent
];

interface AdvancedStats {
  semester: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  } | null;
  compliance: {
    tutor_id: string;
    full_name: string;
    avatar_url: string | null;
    total_minutes: number;
    sessions_count: number;
    is_compliant: boolean;
    progress_percentage: number;
  }[];
  hall_of_fame: {
    most_hours_week: {
      tutor_id: string;
      full_name: string;
      value: number;
    } | null;
    most_hours_month: {
      tutor_id: string;
      full_name: string;
      value: number;
    } | null;
    most_hours_semester: {
      tutor_id: string;
      full_name: string;
      value: number;
    } | null;
    most_hours_year: {
      tutor_id: string;
      full_name: string;
      value: number;
    } | null;
    best_rating: { tutor_id: string; full_name: string; value: number } | null;
    most_students: {
      tutor_id: string;
      full_name: string;
      value: number;
    } | null;
    most_xp: { user_id: string; full_name: string; value: number } | null;
  };
  supply_demand: {
    subject_name: string;
    supply_count: number;
    demand_count: number;
  }[];
}

interface GeneralStats {
  totalUsers: number;
  totalTutors: number;
  totalSessions: number;
  completedSessions: number;
  pendingSessions: number;
  totalRepositories: number;
  totalCards: number;
  avgRating: number;
  dailyActiveUsers: number;
  roleBreakdown: { name: string; value: number }[];
  sessionsByStatus: { name: string; value: number }[];
}

type PageError =
  | { type: "migration"; message: string }
  | { type: "rpc"; message: string; hint?: string }
  | { type: "generic"; message: string };

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [pageError, setPageError] = useState<PageError | null>(null);
  const [noSemester, setNoSemester] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin Create State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [adminForm, setAdminForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [adminFormError, setAdminFormError] = useState("");

  // Semester Config State
  const [semesterDialog, setSemesterDialog] = useState(false);
  const [semesterForm, setSemesterForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });
  const [configuring, setConfiguring] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Hall of Fame State
  const [hofStartDate, setHofStartDate] = useState<string>("");
  const [hofEndDate, setHofEndDate] = useState<string>("");
  const [hofData, setHofData] = useState<AdvancedStats["hall_of_fame"] | null>(
    null,
  );
  const [hofLoading, setHofLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    setPageError(null);
    setNoSemester(false);
    try {
      const [resAdv, resGen] = await Promise.all([
        fetch("/api/admin/advanced-analytics"),
        fetch("/api/admin/general-analytics"),
      ]);
      const jsonAdv = await resAdv.json();
      const jsonGen = await resGen.json();

      if (jsonAdv.migrationRequired) {
        setPageError({ type: "migration", message: jsonAdv.error });
        return;
      }
      if (!resAdv.ok) {
        setPageError({
          type: "rpc",
          message: jsonAdv.error,
          hint: jsonAdv.hint,
        });
        return;
      }
      if (jsonGen.success) {
        setGeneralStats(jsonGen.data);
      }
      if (jsonAdv.noSemester) {
        setNoSemester(true);
        setStats(jsonAdv.data);
        return;
      }
      setStats(jsonAdv.data);

      // Initialize Hall of Fame dates to the active semester if it exists
      if (jsonAdv.data?.semester) {
        setHofStartDate(jsonAdv.data.semester.start_date);
        setHofEndDate(jsonAdv.data.semester.end_date);
      }
    } catch (e) {
      const error = e as Error;
      setPageError({
        type: "generic",
        message: error.message ?? "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHallOfFame = async () => {
    if (!hofStartDate || !hofEndDate) return;
    setHofLoading(true);
    try {
      const res = await fetch(
        `/api/admin/hall-of-fame?start_date=${hofStartDate}&end_date=${hofEndDate}`,
      );
      const json = await res.json();
      if (json.success) {
        setHofData(json.data);
      } else {
        toast.error(json.error || "Failed to load Hall of Fame records");
      }
    } catch (e) {
      toast.error("An error occurred while loading Hall of Fame records.");
    } finally {
      setHofLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Auto-refresh every 5 minutes (300000ms)
    const interval = setInterval(() => {
      loadStats();
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hofStartDate && hofEndDate) {
      loadHallOfFame();
    }
  }, [hofStartDate, hofEndDate]);

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminFormError("");
    if (adminForm.password !== adminForm.confirmPassword)
      return setAdminFormError("Passwords do not match.");
    if (adminForm.password.length < 8)
      return setAdminFormError("Password must be at least 8 characters.");

    setCreating(true);
    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error?.message || "Failed to create admin");

      toast.success(`Administrator created: ${adminForm.email}`);
      setDialogOpen(false);
      setAdminForm({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (e) {
      const error = e as Error;
      setAdminFormError(error.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleConfigureSemester(e: React.FormEvent) {
    e.preventDefault();
    setConfiguring(true);
    try {
      const res = await fetch("/api/admin/semester-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(semesterForm),
      });
      if (!res.ok) throw new Error("Failed to configure semester");
      toast.success("Semester configured successfully");
      setSemesterDialog(false);
      loadStats();
    } catch (e) {
      const error = e as Error;
      toast.error(error.message);
    } finally {
      setConfiguring(false);
    }
  }

  // Export is handled by the ExportCsvButton component now

  const exportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Migration not applied yet ---
  if (pageError?.type === "migration") {
    return (
      <div className="flex flex-col gap-4 items-center justify-center py-20 text-center max-w-xl mx-auto">
        <div className="rounded-full bg-amber-500/10 p-4">
          <FileText className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold">Database Migration Required</h2>
        <p className="text-muted-foreground text-sm">
          The advanced analytics system needs a one-time database setup. Copy
          the file below and run it in your Supabase SQL Editor.
        </p>
        <div className="w-full rounded-md border bg-muted/50 px-4 py-3 text-left text-sm font-mono text-muted-foreground">
          supabase/migrations/20260522_advanced_analytics_rpc.sql
        </div>
        <Button onClick={loadStats} variant="outline">
          Retry after applying migration
        </Button>
      </div>
    );
  }

  // --- RPC / generic error ---
  if (pageError) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center py-20 text-center max-w-xl mx-auto">
        <div className="rounded-full bg-destructive/10 p-4">
          <Loader2 className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Analytics Error</h2>
        <p className="text-muted-foreground text-sm">{pageError.message}</p>
        {pageError.type === "rpc" && pageError.hint && (
          <p className="text-xs text-muted-foreground border rounded px-3 py-2 bg-muted/40">
            {pageError.hint}
          </p>
        )}
        <Button onClick={loadStats} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  const compliantCount = stats.compliance.filter((c) => c.is_compliant).length;
  const totalTutors = stats.compliance.length;
  const totalMinutes = stats.compliance.reduce(
    (acc, c) => acc + c.total_minutes,
    0,
  );

  return (
    <div className="flex flex-col gap-6" ref={printRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground">
            Semester: {stats.semester?.name || "None active"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={loadStats}
            disabled={loading}
            title="Refresh data"
          >
            <Activity
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {noSemester ? null : (
            <ExportCsvButton
              data={stats.compliance.map((c) => ({
                "Tutor ID": c.tutor_id,
                "Full Name": c.full_name,
                "Total Minutes": c.total_minutes,
                "Total Hours": (c.total_minutes / 60).toFixed(1),
                Sessions: c.sessions_count,
                "Compliance %": c.progress_percentage,
                Status: c.is_compliant ? "PASSED" : "FAILED",
              }))}
              filename={`semester_compliance_${stats.semester?.name ?? "export"}`}
            />
          )}
          {noSemester ? null : (
            <Button variant="outline" onClick={exportPDF}>
              <FileText className="mr-2 h-4 w-4" /> PDF Report
            </Button>
          )}

          <Dialog open={semesterDialog} onOpenChange={setSemesterDialog}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Calendar className="mr-2 h-4 w-4" /> Config Semester
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Active Semester</DialogTitle>
                <DialogDescription>
                  Lock in the dates to track the 90-hour requirement.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleConfigureSemester}
                className="flex flex-col gap-4"
              >
                <div className="grid gap-2">
                  <Label>Semester Name</Label>
                  <Input
                    required
                    value={semesterForm.name}
                    onChange={(e) =>
                      setSemesterForm({ ...semesterForm, name: e.target.value })
                    }
                    placeholder="Fall 2026"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      required
                      value={semesterForm.start_date}
                      onChange={(e) =>
                        setSemesterForm({
                          ...semesterForm,
                          start_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      required
                      value={semesterForm.end_date}
                      onChange={(e) =>
                        setSemesterForm({
                          ...semesterForm,
                          end_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <Button type="submit" disabled={configuring}>
                  {configuring ? "Saving..." : "Save & Activate"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <ShieldPlus className="mr-2 h-4 w-4" /> New Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Administrator</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleCreateAdmin}
                className="flex flex-col gap-4"
              >
                <Input
                  required
                  placeholder="Full Name"
                  value={adminForm.full_name}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, full_name: e.target.value })
                  }
                />
                <Input
                  required
                  type="email"
                  placeholder="Email"
                  value={adminForm.email}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, email: e.target.value })
                  }
                />
                <Input
                  required
                  type="password"
                  placeholder="Password"
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, password: e.target.value })
                  }
                />
                <Input
                  required
                  type="password"
                  placeholder="Confirm Password"
                  value={adminForm.confirmPassword}
                  onChange={(e) =>
                    setAdminForm({
                      ...adminForm,
                      confirmPassword: e.target.value,
                    })
                  }
                />
                {adminFormError && (
                  <p className="text-sm text-destructive">{adminFormError}</p>
                )}
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Printable Report Header (Hidden on screen) */}
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-3xl font-black uppercase tracking-wider">
          ScholarMe Executive Report
        </h1>
        <p className="text-lg mt-2 font-medium">
          Semester: {stats.semester?.name}
        </p>
        <p className="text-sm mt-1 text-gray-500">
          Generated on {new Date().toLocaleDateString()}
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 print:hidden mb-4 h-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="compliance">Scholar Compliance</TabsTrigger>
          <TabsTrigger value="records">Hall of Fame</TabsTrigger>
          <TabsTrigger value="system">System & Demand</TabsTrigger>
        </TabsList>

        <TabsContent
          value="general"
          className="flex flex-col gap-6 print:block"
        >
          <GeneralAnalyticsTab generalStats={generalStats} />
        </TabsContent>

        <TabsContent
          value="compliance"
          className="flex flex-col gap-6 print:block"
        >
          <TutorAnalyticsTab stats={stats} noSemester={noSemester} />
        </TabsContent>

        <TabsContent value="records" className="print:block">
          <HallOfFameTab
            stats={stats}
            hofStartDate={hofStartDate}
            setHofStartDate={setHofStartDate}
            hofEndDate={hofEndDate}
            setHofEndDate={setHofEndDate}
            hofData={hofData}
            hofLoading={hofLoading}
          />
        </TabsContent>

        <TabsContent value="system" className="print:block">
          <SystemAnalyticsTab stats={stats} />
        </TabsContent>
      </Tabs>

      {/* Print Footer */}
      <div className="hidden print:block mt-12 pt-8 border-t text-center text-sm text-gray-500">
        <p>End of Semester Executive Report.</p>
        <p>Confidential & Proprietary - ScholarMe Organization</p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
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
