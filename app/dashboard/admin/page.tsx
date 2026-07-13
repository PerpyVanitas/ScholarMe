import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, BookOpen, Clock, ShieldAlert, Camera } from "lucide-react";
import Link from "next/link";
import { AdminCharts } from "@/features/admin/components/admin-charts";
import { GOVERNANCE_ROLES, getRoleName, hasAnyRole } from "@/lib/utils/roles";

export const metadata = {
  title: "Admin Dashboard | ScholarMe",
  description: "Platform analytics and overview",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", session.user.id)
    .single();

  const roleName = profile ? getRoleName(profile) : undefined;
  if (!hasAnyRole(roleName, GOVERNANCE_ROLES)) {
    redirect("/dashboard/home");
  }

  // Get users count
  const { count: usersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Get active sessions count
  const { count: activeSessions } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .in("status", ["scheduled", "in_progress"]);

  // Get resources count
  const { count: resourcesCount } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true });

  // Get tutors count
  const { count: tutorsCount } = await supabase
    .from("tutors")
    .select("*", { count: "exact", head: true });

  // Retention Data (Active vs Inactive approximation)
  const { count: activeCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .not("role_expires_at", "is", null);

  const retentionData = {
    active: activeCount || 0,
    inactive: Math.max(0, (usersCount || 0) - (activeCount || 0)),
  };

  // Top No-Shows Data
  const { data: noShowData } = await supabase
    .from("sessions")
    .select("student_id, profiles!student_id(full_name)")
    .eq("status", "no_show");

  const noShowMap = new Map<string, { name: string; count: number }>();
  if (noShowData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    noShowData.forEach((s: any) => {
      const name = s.profiles?.full_name || "Unknown";
      if (!noShowMap.has(name)) noShowMap.set(name, { name, count: 0 });
      noShowMap.get(name)!.count++;
    });
  }
  const topNoShows = Array.from(noShowMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // User Growth Data
  const { data: userDates } = await supabase.from("profiles").select("created_at");
  const growthMap = new Map<string, number>();
  if (userDates) {
    userDates.forEach((u) => {
      const month = new Date(u.created_at).toLocaleString("default", { month: "short" });
      growthMap.set(month, (growthMap.get(month) || 0) + 1);
    });
  }
  const userGrowthData = Array.from(growthMap.entries()).map(([date, users]) => ({ date, users }));

  // Session Activity Data
  const { data: sessionStats } = await supabase.from("sessions").select("status");
  const sessionCounts = { completed: 0, scheduled: 0, cancelled: 0, no_show: 0 };
  if (sessionStats) {
    sessionStats.forEach((s) => {
      if (s.status === "completed") sessionCounts.completed++;
      if (s.status === "scheduled") sessionCounts.scheduled++;
      if (s.status === "cancelled") sessionCounts.cancelled++;
      if (s.status === "no_show") sessionCounts.no_show++;
    });
  }
  const sessionActivityData = [
    { status: "Completed", count: sessionCounts.completed },
    { status: "Scheduled", count: sessionCounts.scheduled },
    { status: "Cancelled", count: sessionCounts.cancelled },
    { status: "No Show", count: sessionCounts.no_show },
  ];

  return (
    <div className="flex-1 space-y-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount || 0}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently scheduled or ongoing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourcesCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Files in the study library
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tutors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tutorsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Approved platform tutors
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/admin/scanner">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-border/60">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">ID Card Scanner</CardTitle>
                <CardDescription>
                  Scan digital IDs to view student audit logs
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Additional admin widgets could go here */}
      <AdminCharts
        userGrowthData={userGrowthData}
        sessionActivityData={sessionActivityData}
        retentionData={retentionData}
        topNoShows={topNoShows}
      />
    </div>
  );
}
