import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  BookOpen,
  Clock,
  ShieldAlert,
  UserCog,
  Camera,
} from "lucide-react";
import Link from "next/link";
import { AdminCharts } from "@/components/admin-charts";

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
    redirect("/auth/login");
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles!inner(name)")
    .eq("id", session.user.id)
    .single();

  const role = Array.isArray(profile?.roles)
    ? profile?.roles[0]?.name
    : (profile?.roles as any)?.name;

  if (role !== "administrator" && role !== "super_admin") {
    redirect("/dashboard/home");
  }

  // Fetch some aggregate stats
  const [
    usersCount,
    sessionsCount,
    resourcesCount,
    tutorsCount,
    { data: allUsers },
    { data: allSessions },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("sessions").select("*", { count: "exact", head: true }),
    supabase.from("resources").select("*", { count: "exact", head: true }),
    supabase.from("tutors").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("created_at"),
    supabase.from("sessions").select("status"),
  ]);

  // Process data for charts
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const userGrowthData = last7Days.map((date) => {
    const count =
      allUsers?.filter((u) => u.created_at.startsWith(date)).length || 0;
    return { date: date.slice(5), users: count };
  });

  const sessionActivityData = [
    {
      status: "Pending",
      count: allSessions?.filter((s) => s.status === "pending").length || 0,
    },
    {
      status: "Confirmed",
      count: allSessions?.filter((s) => s.status === "confirmed").length || 0,
    },
    {
      status: "Completed",
      count: allSessions?.filter((s) => s.status === "completed").length || 0,
    },
    {
      status: "Cancelled",
      count: allSessions?.filter((s) => s.status === "cancelled").length || 0,
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount.count || 0}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Platform Sessions
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionsCount.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tutoring sessions logged
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resources Shared
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resourcesCount.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Files in repositories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <ShieldAlert className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">Online</div>
            <p className="text-xs text-muted-foreground">
              All services operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tutors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tutorsCount.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Approved platform tutors
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/admin/roles">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-border/60">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserCog className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Role Management</CardTitle>
                <CardDescription>
                  Assign or revoke platform access levels
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
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
      />
    </div>
  );
}
