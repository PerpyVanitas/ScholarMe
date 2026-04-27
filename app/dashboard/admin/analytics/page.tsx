/** Admin analytics page — org-wide stat cards, charts, and admin account creation. */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users, GraduationCap, Calendar, Star, BookOpen,
  CreditCard, Loader2, ShieldPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

interface Stats {
  totalUsers: number;
  totalTutors: number;
  totalSessions: number;
  completedSessions: number;
  pendingSessions: number;
  cancelledSessions: number;
  totalRepositories: number;
  totalCards: number;
  avgRating: number;
}

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [roleBreakdown, setRoleBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [sessionsByStatus, setSessionsByStatus] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Create-admin dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [adminForm, setAdminForm] = useState({ full_name: "", email: "", password: "", confirmPassword: "" });
  const [adminFormError, setAdminFormError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [
        usersRes, tutorsRes, sessionsRes,
        completedRes, pendingRes, cancelledRes,
        reposRes, cardsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("tutors").select("*", { count: "exact", head: true }),
        supabase.from("sessions").select("*", { count: "exact", head: true }),
        supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
        supabase.from("repositories").select("*", { count: "exact", head: true }),
        supabase.from("auth_cards").select("*", { count: "exact", head: true }),
      ]);

      const { data: tutors } = await supabase.from("tutors").select("rating").gt("total_ratings", 0);
      const avgRating = tutors?.length
        ? tutors.reduce((acc, t) => acc + t.rating, 0) / tutors.length
        : 0;

      const { data: profilesWithRoles } = await supabase.from("profiles").select("roles(name)");
      const roleCounts: Record<string, number> = {};
      (profilesWithRoles || []).forEach((p: any) => {
        const roles = Array.isArray(p.roles) ? p.roles : [];
        if (roles.length > 0) {
          const role = roles[0].name || "unknown";
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        } else {
          roleCounts["unknown"] = (roleCounts["unknown"] || 0) + 1;
        }
      });
      setRoleBreakdown(
        Object.entries(roleCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))
      );

      const confirmed = Math.max(
        0,
        (sessionsRes.count || 0) - (completedRes.count || 0) - (pendingRes.count || 0) - (cancelledRes.count || 0)
      );
      setSessionsByStatus([
        { name: "Completed", value: completedRes.count || 0 },
        { name: "Pending", value: pendingRes.count || 0 },
        { name: "Confirmed", value: confirmed },
        { name: "Cancelled", value: cancelledRes.count || 0 },
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalTutors: tutorsRes.count || 0,
        totalSessions: sessionsRes.count || 0,
        completedSessions: completedRes.count || 0,
        pendingSessions: pendingRes.count || 0,
        cancelledSessions: cancelledRes.count || 0,
        totalRepositories: reposRes.count || 0,
        totalCards: cardsRes.count || 0,
        avgRating,
      });

      setLoading(false);
    }
    load();
  }, []);

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminFormError("");

    if (adminForm.password !== adminForm.confirmPassword) {
      setAdminFormError("Passwords do not match.");
      return;
    }
    if (adminForm.password.length < 8) {
      setAdminFormError("Password must be at least 8 characters.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminForm.email,
          password: adminForm.password,
          full_name: adminForm.full_name,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        const msg = json.error?.details || json.error?.message || "Failed to create admin account.";
        setAdminFormError(typeof msg === "string" ? msg : JSON.stringify(msg));
        return;
      }

      toast.success(`Administrator account created for ${adminForm.email}`);
      setDialogOpen(false);
      setAdminForm({ full_name: "", email: "", password: "", confirmPassword: "" });
      // Refresh user count
      setStats((prev) => prev ? { ...prev, totalUsers: prev.totalUsers + 1 } : prev);
    } catch {
      setAdminFormError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Organization insights and metrics.</p>
        </div>

        {/* Create Admin button */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); setAdminFormError(""); }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 shrink-0">
              <ShieldPlus className="h-4 w-4" />
              Create Admin Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Administrator Account</DialogTitle>
              <DialogDescription>
                The new account will have full administrative access to ScholarMe.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAdmin} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="admin-name">Full Name <span className="text-destructive">*</span></Label>
                <Input id="admin-name" type="text" placeholder="Jane Smith" required
                  value={adminForm.full_name}
                  onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="admin-email">Email <span className="text-destructive">*</span></Label>
                <Input id="admin-email" type="email" placeholder="admin@example.com" required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="admin-password">Password <span className="text-destructive">*</span></Label>
                <Input id="admin-password" type="password" placeholder="Min. 8 characters" required minLength={8}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="admin-confirm">Confirm Password <span className="text-destructive">*</span></Label>
                <Input id="admin-confirm" type="password" placeholder="Repeat password" required minLength={8}
                  value={adminForm.confirmPassword}
                  onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })} />
              </div>

              {adminFormError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
                  <p className="text-sm text-destructive">{adminFormError}</p>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5 text-primary" />} label="Total Users" value={stats.totalUsers} />
        <StatCard icon={<GraduationCap className="h-5 w-5 text-success" />} label="Active Tutors" value={stats.totalTutors} />
        <StatCard icon={<Calendar className="h-5 w-5 text-primary" />} label="Total Sessions" value={stats.totalSessions} />
        <StatCard icon={<Star className="h-5 w-5 text-accent" />} label="Avg Rating" value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"} />
        <StatCard icon={<BookOpen className="h-5 w-5 text-primary" />} label="Repositories" value={stats.totalRepositories} />
        <StatCard icon={<CreditCard className="h-5 w-5 text-muted-foreground" />} label="Cards Issued" value={stats.totalCards} />
        <StatCard icon={<Calendar className="h-5 w-5 text-success" />} label="Completed" value={stats.completedSessions} />
        <StatCard icon={<Calendar className="h-5 w-5 text-warning" />} label="Pending" value={stats.pendingSessions} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Users by Role</CardTitle>
            <CardDescription>Distribution of users across roles</CardDescription>
          </CardHeader>
          <CardContent>
            {roleBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roleBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={5} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}>
                      {roleBreakdown.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Sessions by Status</CardTitle>
            <CardDescription>Breakdown of session statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionsByStatus.every((s) => s.value === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">No session data yet</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: "oklch(0.5 0.02 255)" }} />
                    <YAxis allowDecimals={false} className="text-xs" tick={{ fill: "oklch(0.5 0.02 255)" }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {sessionsByStatus.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
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
