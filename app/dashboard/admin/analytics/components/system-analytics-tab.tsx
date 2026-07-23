"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";

interface SystemAnalyticsTabProps {
  stats: unknown;
}

export function SystemAnalyticsTab({ stats }: SystemAnalyticsTabProps) {
  if (!stats) return null;

  return (
    <div className="print:block">
      <Card>
        <CardHeader>
          <CardTitle>Subject Supply vs. Demand</CardTitle>
          <CardDescription>
            Number of tutors holding a specialization (Supply) vs. sessions
            requested (Demand).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={
                  (stats.supply_demand as unknown as Array<
                    Record<string, unknown>
                  >) || []
                }
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="subject_name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Legend />
                <Bar
                  dataKey="supply_count"
                  name="Available Tutors"
                  barSize={30}
                  fill="var(--color-chart-1)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="demand_count"
                  name="Sessions Demanded"
                  stroke="var(--color-chart-5)"
                  strokeWidth={3}
                  dot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
