import {
  Users,
  Activity,
  GraduationCap,
  Calendar,
  BookOpen,
  CreditCard,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "recharts";

const CHART_COLORS = [
  "oklch(0.5 0.02 255)", // primary
  "oklch(0.6 0.1 140)", // success
  "oklch(0.65 0.15 40)", // destructive
  "oklch(0.7 0.15 80)", // warning
  "oklch(0.4 0.1 200)", // accent
];

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

export function GeneralAnalyticsTab({
  generalStats,
}: {
  generalStats: GeneralStats | null;
}) {
  if (!generalStats) return null;

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <StatCard
          icon={<Users className="h-5 w-5 text-primary" />}
          label="Total Users"
          value={generalStats.totalUsers}
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-success" />}
          label="Daily Active Users"
          value={generalStats.dailyActiveUsers}
        />
      </div>

      {/* Primary Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<GraduationCap className="h-5 w-5 text-success" />}
          label="Active Tutors"
          value={generalStats.totalTutors}
        />
        <StatCard
          icon={<Calendar className="h-5 w-5 text-primary" />}
          label="Total Sessions"
          value={generalStats.totalSessions}
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5 text-primary" />}
          label="Repositories"
          value={generalStats.totalRepositories}
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5 text-muted-foreground" />}
          label="Cards Issued"
          value={generalStats.totalCards}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
            <CardDescription>Breakdown of users by role</CardDescription>
          </CardHeader>
          <CardContent>
            {generalStats.roleBreakdown.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No role data found.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={generalStats.roleBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {generalStats.roleBreakdown.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Status Overview</CardTitle>
            <CardDescription>Breakdown of session statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {generalStats.sessionsByStatus.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No session data found.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={generalStats.sessionsByStatus}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border/50"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-xs"
                      tick={{ fill: "oklch(0.5 0.02 255)" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      className="text-xs"
                      tick={{ fill: "oklch(0.5 0.02 255)" }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {generalStats.sessionsByStatus.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
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
