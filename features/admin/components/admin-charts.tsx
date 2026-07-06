"use client";

import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AdminCharts({
  userGrowthData,
  sessionActivityData,
}: {
  userGrowthData: { date: string; users: number }[];
  sessionActivityData: { status: string; count: number }[];
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const textColor = isDark ? "#888888" : "#888888";
  const gridColor = isDark ? "#333333" : "#e5e5e5";
  const primaryColor = isDark ? "#FFD700" : "#000000";
  const secondaryColor = isDark ? "#3b82f6" : "#3b82f6";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4 border-border/60">
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>
            New registrations over the last 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={userGrowthData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={primaryColor}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={primaryColor}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke={textColor}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={textColor}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#18181b" : "#fff",
                    borderColor: isDark ? "#27272a" : "#e5e5e5",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: isDark ? "#fff" : "#000" }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke={primaryColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-3 border-border/60">
        <CardHeader>
          <CardTitle>Session Activity</CardTitle>
          <CardDescription>Tutoring sessions status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sessionActivityData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="status"
                  stroke={textColor}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={textColor}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: isDark ? "#27272a" : "#f4f4f5" }}
                  contentStyle={{
                    backgroundColor: isDark ? "#18181b" : "#fff",
                    borderColor: isDark ? "#27272a" : "#e5e5e5",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={secondaryColor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
