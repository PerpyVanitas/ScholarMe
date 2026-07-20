"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Users, Star, Clock, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TutorStat {
  id: string;
  rating: number;
  total_sessions_completed: number;
  total_students_helped: number;
  response_rate: number;
  total_hours_tutored: number;
  profiles: {
    full_name: string;
    avatar_url: string;
    email: string;
  };
}

export default function TutorAnalyticsPage() {
  const [tutors, setTutors] = useState<TutorStat[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      // Fetch all tutors joined with their profiles
      const { data, error } = await supabase
        .from("tutors")
        .select(
          `
          id,
          rating,
          total_sessions_completed,
          total_students_helped,
          response_rate,
          total_hours_tutored,
          profiles (full_name, avatar_url, email)
        `,
        )
        .order("total_sessions_completed", { ascending: false });

      if (!error && data) {
        setTutors(data as unknown as TutorStat[]);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Aggregate Metrics
  const totalTutors = tutors.length;
  const totalSessionsAllTime = tutors.reduce(
    (acc, t) => acc + (t.total_sessions_completed || 0),
    0,
  );
  const totalHoursAllTime = tutors.reduce(
    (acc, t) => acc + (t.total_hours_tutored || 0),
    0,
  );
  const avgPlatformRating =
    totalTutors > 0
      ? (
          tutors.reduce((acc, t) => acc + (t.rating || 0), 0) / totalTutors
        ).toFixed(1)
      : "0.0";

  // Data for Chart (Top 5 Tutors by Sessions)
  const chartData = tutors.slice(0, 5).map((t) => ({
    name: t.profiles?.full_name?.split(" ")[0] || "Unknown",
    sessions: t.total_sessions_completed || 0,
    hours: t.total_hours_tutored || 0,
  }));

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tutor Analytics</h2>
        <p className="text-muted-foreground mt-1">
          Detailed statistics and performance tracking for all platform tutors.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Active Tutors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTutors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Sessions
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessionsAllTime}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Tutored</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoursAllTime}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Platform Rating
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPlatformRating}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Top Tutors by Sessions</CardTitle>
            <CardDescription>
              Most active tutors based on completed sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--accent)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--background)",
                      color: "var(--foreground)",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="sessions"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                    name="Sessions"
                  />
                  <Bar
                    dataKey="hours"
                    fill="var(--success)"
                    radius={[4, 4, 0, 0]}
                    name="Hours"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Tutor Leaderboard</CardTitle>
            <CardDescription>All tutors ranked by activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {tutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={tutor.profiles?.avatar_url || ""} />
                      <AvatarFallback>
                        {tutor.profiles?.full_name?.charAt(0) || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {tutor.profiles?.full_name}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Star className="mr-1 h-3 w-3 text-yellow-500" />
                        {tutor.rating || "New"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {tutor.total_sessions_completed || 0} sessions
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tutor.total_hours_tutored || 0} hours
                    </p>
                  </div>
                </div>
              ))}
              {tutors.length === 0 && (
                <div className="text-center text-sm text-muted-foreground pt-4">
                  No tutors found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
