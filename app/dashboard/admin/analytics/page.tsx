"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Calendar, Star, BookOpen, CreditCard, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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
  "oklch(0.45 0.18 255)",
  "oklch(0.75 0.15 75)",
  "oklch(0.55 0.17 150)",
  "oklch(0.577 0.245 27.325)",
];

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [roleBreakdown, setRoleBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [sessionsByStatus, setSessionsByStatus] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [
        usersRes,
        tutorsRes,
        sessionsRes,
        completedRes,
        pendingRes,
        cancelledRes,
        reposRes,
        cardsRes,
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

      // Avg rating
      const { data: tutors } = await supabase
        .from("tutors")
        .select("rating")
        .gt("total_ratings", 0);

      const avgRating = tutors && tutors.length > 0
        ? tutors.reduce((acc, t) => acc + t.rating, 0) / tutors.length
        : 0;

      // Role breakdown
      const { data: profilesWithRoles } = await supabase
        .from("profiles")
        .select("roles(name)");

      const roleCounts: Record<string, number> = {};
      (profilesWithRoles || []).forEach((p) => {
        const role = p.roles?.name || "unknown";
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      setRoleBreakdown(
        Object.entries(roleCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))
      );

      const confirmed = (sessionsRes.count || 0) - (completedRes.count || 0) - (pendingRes.count || 0) - (cancelledRes.count || 0);

      setSessionsByStatus([
        { name: "Completed", value: completedRes.count || 0 },
        { name: "Pending", value: pendingRes.count || 0 },
        { name: "Confirmed", value: confirmed > 0 ? confirmed : 0 },
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

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Organization insights and metrics.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5 text-primary" />} label="Total Users" value={stats.totalUsers} />
        <StatCard icon={<GraduationCap className="h-5 w-5 text-success" />} label="Active Tutors" value={stats.totalTutors} />
        <StatCard icon={<Calendar className="h-5 w-5 text-accent-foreground" />} label="Total Sessions" value={stats.totalSessions} />
        <StatCard
          icon={<Star className="h-5 w-5 text-accent-foreground" />}
          label="Avg Rating"
          value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
        />
        <StatCard icon={<BookOpen className="h-5 w-5 text-primary" />} label="Repositories" value={stats.totalRepositories} />
        <StatCard icon={<CreditCard className="h-5 w-5 text-muted-foreground" />} label="Cards Issued" value={stats.totalCards} />
        <StatCard icon={<Calendar className="h-5 w-5 text-success" />} label="Completed" value={stats.completedSessions} />
        <StatCard icon={<Calendar className="h-5 w-5 text-warning-foreground" />} label="Pending" value={stats.pendingSessions} />
      </div>

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
                    <Pie
                      data={roleBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {roleBreakdown.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: "oklch(0.5 0.02 250)" }} />
                    <YAxis allowDecimals={false} className="text-xs" tick={{ fill: "oklch(0.5 0.02 250)" }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {sessionsByStatus.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
