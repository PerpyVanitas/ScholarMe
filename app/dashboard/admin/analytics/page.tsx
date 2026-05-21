"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Users, Calendar, ShieldPlus, Loader2,
  Trophy, Medal, Star, DownloadCloud, FileText
} from "lucide-react";
import { toast } from "sonner";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Bar, Line, Legend,
} from "recharts";

interface AdvancedStats {
  semester: { id: string; name: string; start_date: string; end_date: string } | null;
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
    most_hours: { tutor_id: string; full_name: string; value: number } | null;
    best_rating: { tutor_id: string; full_name: string; value: number } | null;
    most_students: { tutor_id: string; full_name: string; value: number } | null;
    most_xp: { user_id: string; full_name: string; value: number } | null;
  };
  supply_demand: { subject_name: string; supply_count: number; demand_count: number }[];
}

type PageError =
  | { type: "migration"; message: string }
  | { type: "rpc"; message: string; hint?: string }
  | { type: "generic"; message: string };

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [pageError, setPageError] = useState<PageError | null>(null);
  const [noSemester, setNoSemester] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin Create State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [adminForm, setAdminForm] = useState({ full_name: "", email: "", password: "", confirmPassword: "" });
  const [adminFormError, setAdminFormError] = useState("");

  // Semester Config State
  const [semesterDialog, setSemesterDialog] = useState(false);
  const [semesterForm, setSemesterForm] = useState({ name: "", start_date: "", end_date: "" });
  const [configuring, setConfiguring] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const loadStats = async () => {
    setLoading(true);
    setPageError(null);
    setNoSemester(false);
    try {
      const res = await fetch("/api/admin/advanced-analytics");
      const json = await res.json();

      if (json.migrationRequired) {
        setPageError({ type: "migration", message: json.error });
        return;
      }
      if (!res.ok) {
        setPageError({ type: "rpc", message: json.error, hint: json.hint });
        return;
      }
      if (json.noSemester) {
        setNoSemester(true);
        setStats(json.data);
        return;
      }
      setStats(json.data);
    } catch (e: any) {
      setPageError({ type: "generic", message: e.message ?? "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminFormError("");
    if (adminForm.password !== adminForm.confirmPassword) return setAdminFormError("Passwords do not match.");
    if (adminForm.password.length < 8) return setAdminFormError("Password must be at least 8 characters.");

    setCreating(true);
    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to create admin");
      
      toast.success(`Administrator created: ${adminForm.email}`);
      setDialogOpen(false);
      setAdminForm({ full_name: "", email: "", password: "", confirmPassword: "" });
    } catch (e: any) {
      setAdminFormError(e.message);
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
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setConfiguring(false);
    }
  }

  const exportCSV = () => {
    if (!stats) return;
    const headers = ["Tutor ID,Full Name,Total Minutes,Total Hours,Sessions,Compliance %,Status"];
    const rows = stats.compliance.map(c => 
      `${c.tutor_id},"${c.full_name}",${c.total_minutes},${(c.total_minutes / 60).toFixed(1)},${c.sessions_count},${c.progress_percentage},${c.is_compliant ? 'PASSED' : 'FAILED'}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `semester_compliance_${stats.semester?.name ?? "export"}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

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
        <p className="text-muted-foreground text-sm">The advanced analytics system needs a one-time database setup. Copy the file below and run it in your Supabase SQL Editor.</p>
        <div className="w-full rounded-md border bg-muted/50 px-4 py-3 text-left text-sm font-mono text-muted-foreground">
          supabase/migrations/20260522_advanced_analytics_rpc.sql
        </div>
        <Button onClick={loadStats} variant="outline">Retry after applying migration</Button>
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
          <p className="text-xs text-muted-foreground border rounded px-3 py-2 bg-muted/40">{pageError.hint}</p>
        )}
        <Button onClick={loadStats} variant="outline">Retry</Button>
      </div>
    );
  }

  if (!stats) return null;

  const compliantCount = stats.compliance.filter(c => c.is_compliant).length;
  const totalTutors = stats.compliance.length;
  const totalMinutes = stats.compliance.reduce((acc, c) => acc + c.total_minutes, 0);

  return (
    <div className="flex flex-col gap-6" ref={printRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">Semester: {stats.semester?.name || "None active"}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {noSemester ? null : <Button variant="outline" onClick={exportCSV}><DownloadCloud className="mr-2 h-4 w-4" /> CSV</Button>}
          {noSemester ? null : <Button variant="outline" onClick={exportPDF}><FileText className="mr-2 h-4 w-4" /> PDF Report</Button>}
          
          <Dialog open={semesterDialog} onOpenChange={setSemesterDialog}>
            <DialogTrigger asChild>
              <Button variant="secondary"><Calendar className="mr-2 h-4 w-4" /> Config Semester</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Active Semester</DialogTitle>
                <DialogDescription>Lock in the dates to track the 90-hour requirement.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleConfigureSemester} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label>Semester Name</Label>
                  <Input required value={semesterForm.name} onChange={e => setSemesterForm({...semesterForm, name: e.target.value})} placeholder="Fall 2026" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Input type="date" required value={semesterForm.start_date} onChange={e => setSemesterForm({...semesterForm, start_date: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Input type="date" required value={semesterForm.end_date} onChange={e => setSemesterForm({...semesterForm, end_date: e.target.value})} />
                  </div>
                </div>
                <Button type="submit" disabled={configuring}>{configuring ? "Saving..." : "Save & Activate"}</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><ShieldPlus className="mr-2 h-4 w-4" /> New Admin</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Administrator</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateAdmin} className="flex flex-col gap-4">
                <Input required placeholder="Full Name" value={adminForm.full_name} onChange={e => setAdminForm({...adminForm, full_name: e.target.value})} />
                <Input required type="email" placeholder="Email" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} />
                <Input required type="password" placeholder="Password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} />
                <Input required type="password" placeholder="Confirm Password" value={adminForm.confirmPassword} onChange={e => setAdminForm({...adminForm, confirmPassword: e.target.value})} />
                {adminFormError && <p className="text-sm text-destructive">{adminFormError}</p>}
                <Button type="submit" disabled={creating}>{creating ? "Creating..." : "Create"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Printable Report Header (Hidden on screen) */}
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-3xl font-black uppercase tracking-wider">ScholarMe Executive Report</h1>
        <p className="text-lg mt-2 font-medium">Semester: {stats.semester?.name}</p>
        <p className="text-sm mt-1 text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      <Tabs defaultValue="compliance" className="w-full">
        <TabsList className="grid w-full grid-cols-3 print:hidden mb-4">
          <TabsTrigger value="compliance">Scholar Compliance</TabsTrigger>
          <TabsTrigger value="records">Hall of Fame</TabsTrigger>
          <TabsTrigger value="system">System & Demand</TabsTrigger>
        </TabsList>
        
        <TabsContent value="compliance" className="flex flex-col gap-6 print:block">
          {noSemester && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-6 py-8 text-center">
              <Calendar className="h-8 w-8 text-amber-500" />
              <h3 className="font-bold text-lg">No Active Semester Configured</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                The 90-hour compliance tracker requires an active semester to be set. Click <strong>Config Semester</strong> in the header to lock in the start and end dates for the current semester.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-medium text-primary uppercase">Total Semester Hours</p>
                <p className="text-4xl font-black mt-2 text-primary">{(totalMinutes / 60).toFixed(0)} <span className="text-lg font-normal">hrs</span></p>
              </CardContent>
            </Card>
            <Card className="bg-success/5 border-success/20">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-medium text-success uppercase">Compliance Rate</p>
                <p className="text-4xl font-black mt-2 text-success">
                  {totalTutors ? Math.round((compliantCount / totalTutors) * 100) : 0}%
                </p>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-medium text-destructive uppercase">At Risk (&lt; 50%)</p>
                <p className="text-4xl font-black mt-2 text-destructive">
                  {stats.compliance.filter(c => c.progress_percentage < 50).length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>90-Hour Tracking</CardTitle>
              <CardDescription>Progress towards the 5,400 minute requirement.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {stats.compliance
                  .sort((a, b) => b.progress_percentage - a.progress_percentage)
                  .map((tutor) => (
                  <div key={tutor.tutor_id} className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="font-bold">{tutor.full_name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{tutor.sessions_count} sessions</span>
                      </div>
                      <div className="text-sm font-medium">
                        {(tutor.total_minutes / 60).toFixed(1)} / 90 hrs ({tutor.progress_percentage}%)
                      </div>
                    </div>
                    <Progress 
                      value={tutor.progress_percentage} 
                      className="h-2" 
                      indicatorColor={
                        tutor.progress_percentage >= 100 ? "bg-success" : 
                        tutor.progress_percentage > 50 ? "bg-warning" : "bg-destructive"
                      }
                    />
                  </div>
                ))}
                {stats.compliance.length === 0 && <p className="text-center text-muted-foreground">No active tutors found this semester.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="print:block">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="border-yellow-500/30 bg-yellow-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="w-32 h-32" /></div>
              <CardHeader><CardTitle className="text-yellow-600 dark:text-yellow-500">Most Hours Served</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-black">{stats.hall_of_fame.most_hours?.full_name || "N/A"}</p>
                <p className="text-lg text-muted-foreground">{(stats.hall_of_fame.most_hours?.value ? stats.hall_of_fame.most_hours.value / 60 : 0).toFixed(1)} Hours</p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/30 bg-blue-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Star className="w-32 h-32" /></div>
              <CardHeader><CardTitle className="text-blue-600 dark:text-blue-400">Highest Rated Tutor</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-black">{stats.hall_of_fame.best_rating?.full_name || "N/A"}</p>
                <p className="text-lg text-muted-foreground">{stats.hall_of_fame.best_rating?.value || 0} Average Rating</p>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-green-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Users className="w-32 h-32" /></div>
              <CardHeader><CardTitle className="text-green-600 dark:text-green-400">Most Unique Students</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-black">{stats.hall_of_fame.most_students?.full_name || "N/A"}</p>
                <p className="text-lg text-muted-foreground">{stats.hall_of_fame.most_students?.value || 0} Students Helped</p>
              </CardContent>
            </Card>

            <Card className="border-purple-500/30 bg-purple-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Medal className="w-32 h-32" /></div>
              <CardHeader><CardTitle className="text-purple-600 dark:text-purple-400">Top Learner (Most XP)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-black">{stats.hall_of_fame.most_xp?.full_name || "N/A"}</p>
                <p className="text-lg text-muted-foreground">{stats.hall_of_fame.most_xp?.value || 0} XP Earned</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="print:block">
          <Card>
            <CardHeader>
              <CardTitle>Subject Supply vs. Demand</CardTitle>
              <CardDescription>Number of tutors holding a specialization (Supply) vs. sessions requested (Demand).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.supply_demand} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="subject_name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Legend />
                    <Bar dataKey="supply_count" name="Available Tutors" barSize={30} fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="demand_count" name="Sessions Demanded" stroke="var(--color-chart-5)" strokeWidth={3} dot={{r: 6}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
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
