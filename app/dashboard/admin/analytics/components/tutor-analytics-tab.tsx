"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "lucide-react";

interface TutorAnalyticsTabProps {
  stats: any;
  noSemester: boolean;
}

export function TutorAnalyticsTab({
  stats,
  noSemester,
}: TutorAnalyticsTabProps) {
  if (!stats) return null;

  const compliantCount = stats.compliance.filter(
    (c: any) => c.is_compliant,
  ).length;
  const totalTutors = stats.compliance.length;
  const totalMinutes = stats.compliance.reduce(
    (acc: number, c: any) => acc + c.total_minutes,
    0,
  );

  return (
    <div className="flex flex-col gap-6 print:block">
      {noSemester && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-6 py-8 text-center">
          <Calendar className="h-8 w-8 text-amber-500" />
          <h3 className="font-bold text-lg">No Active Semester Configured</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            The 90-hour compliance tracker requires an active semester to be
            set. Click <strong>Config Semester</strong> in the header to lock in
            the start and end dates for the current semester.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-primary uppercase">
              Total Semester Hours
            </p>
            <p className="text-4xl font-black mt-2 text-primary">
              {(totalMinutes / 60).toFixed(0)}{" "}
              <span className="text-lg font-normal">hrs</span>
            </p>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-success uppercase">
              Compliance Rate
            </p>
            <p className="text-4xl font-black mt-2 text-success">
              {totalTutors
                ? Math.round((compliantCount / totalTutors) * 100)
                : 0}
              %
            </p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-destructive uppercase">
              At Risk (&lt; 50%)
            </p>
            <p className="text-4xl font-black mt-2 text-destructive">
              {
                stats.compliance.filter((c: any) => c.progress_percentage < 50)
                  .length
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>90-Hour Tracking</CardTitle>
          <CardDescription>
            Progress towards the 5,400 minute requirement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {stats.compliance
              .sort(
                (a: any, b: any) =>
                  b.progress_percentage - a.progress_percentage,
              )
              .map((tutor: any) => (
                <div key={tutor.tutor_id} className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="font-bold">{tutor.full_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {tutor.sessions_count} sessions
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      {(tutor.total_minutes / 60).toFixed(1)} / 90 hrs (
                      {tutor.progress_percentage}%)
                    </div>
                  </div>
                  <Progress
                    value={tutor.progress_percentage}
                    className="h-2"
                    indicatorColor={
                      tutor.progress_percentage >= 100
                        ? "bg-success"
                        : tutor.progress_percentage > 50
                          ? "bg-warning"
                          : "bg-destructive"
                    }
                  />
                </div>
              ))}
            {stats.compliance.length === 0 && (
              <p className="text-center text-muted-foreground">
                No active tutors found this semester.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
