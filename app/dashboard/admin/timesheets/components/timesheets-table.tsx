import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Timer } from "lucide-react";
import type { Timesheet } from "@/lib/types";

export interface TutorSummary {
  tutorId: string;
  name: string;
  email: string;
  totalMinutes: number;
  entries: number;
  isActive: boolean;
}

export function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function calcMinutes(clockIn: string, clockOut: string | null) {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  return Math.max(0, (end - start) / 60000);
}

export function fmtDate(d: string) {
  const dt = new Date(d);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
}

export function fmtTime(d: string) {
  const dt = new Date(d);
  const h = dt.getUTCHours();
  const m = dt.getUTCMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m} ${ampm}`;
}

export function TutorSummaryTable({
  isLoading,
  filteredTutors,
}: {
  isLoading: boolean;
  filteredTutors: TutorSummary[];
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Tutor Summary</CardTitle>
        <CardDescription>
          Aggregated hours per tutor for the current active period
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : filteredTutors.length === 0 ? (
          <EmptyState
            icon={Timer}
            title="No timesheet data"
            description="No timesheet data recorded for this period."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">
                    Tutor
                  </th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">
                    Entries
                  </th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">
                    Total Hours
                  </th>
                  <th className="pb-2 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTutors.map((t) => (
                  <tr key={t.tutorId} className="border-b border-border/30">
                    <td className="py-3 pr-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {t.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-foreground">{t.entries}</td>
                    <td className="py-3 pr-4 font-mono text-foreground">
                      {formatDuration(t.totalMinutes)}
                    </td>
                    <td className="py-3">
                      {t.isActive ? (
                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                          Clocked In
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Offline</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AllEntriesTable({
  isLoading,
  filteredEntries,
}: {
  isLoading: boolean;
  filteredEntries: Timesheet[];
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">All Entries</CardTitle>
        <CardDescription>
          Complete clock-in/out log for the current active period
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : filteredEntries.length === 0 ? (
          <EmptyState
            icon={Timer}
            title="No entries found"
            description="No timesheet entries were found matching your criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">
                    Tutor
                  </th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">
                    Clock In
                  </th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">
                    Clock Out
                  </th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">
                    Duration
                  </th>
                  <th className="pb-2 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const mins = calcMinutes(entry.clock_in, entry.clock_out);
                  const profile = entry.tutors?.profiles;
                  return (
                    <tr key={entry.id} className="border-b border-border/30">
                      <td className="py-3 pr-4 text-foreground">
                        {profile?.full_name || "Unknown"}
                      </td>
                      <td className="py-3 pr-4 text-foreground">
                        {fmtDate(entry.clock_in)}
                      </td>
                      <td className="py-3 pr-4 font-mono text-foreground">
                        {fmtTime(entry.clock_in)}
                      </td>
                      <td className="py-3 pr-4 font-mono text-foreground">
                        {entry.clock_out ? fmtTime(entry.clock_out) : "--:--"}
                      </td>
                      <td className="py-3 pr-4 font-mono text-foreground">
                        {formatDuration(mins)}
                      </td>
                      <td className="py-3">
                        {entry.clock_out ? (
                          <Badge variant="secondary">Completed</Badge>
                        ) : (
                          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                            Active
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
