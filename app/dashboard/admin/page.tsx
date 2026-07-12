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

  // Retention Data (mock)
  const retentionData = {
    active: 85,
    inactive: 15,
  };

  // Top No-Shows Data (mock)
  const topNoShows = [
    {
      name: "John Doe",
      count: 5,
    },
    {
      name: "Jane Smith",
      count: 3,
    },
    {
      name: "Mike Johnson",
      count: 2,
    },
  ];

  // User Growth Data
  const userGrowthData = [
    { date: "Jan", users: 120 },
    { date: "Feb", users: 150 },
    { date: "Mar", users: 200 },
    { date: "Apr", users: 280 },
    { date: "May", users: 350 },
    { date: "Jun", users: 450 },
  ];

  // Session Activity Data
  const sessionActivityData = [
    { status: "Completed", count: 400 },
    { status: "Scheduled", count: 300 },
    { status: "Cancelled", count: 150 },
    { status: "No Show", count: 50 },
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
