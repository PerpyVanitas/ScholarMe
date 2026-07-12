import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, Trophy, Star, Users, Medal, Loader2 } from "lucide-react";

interface AdvancedStats {
  hall_of_fame: {
    most_hours_week: {
      tutor_id: string;
      full_name: string;
      value: number;
    } | null;
    most_hours_month: {
      tutor_id: string;
      full_name: string;
      value: number;
    } | null;
    most_hours_semester: {
      tutor_id: string;
      full_name: string;
      value: number;
    } | null;
    most_hours_year: {
      tutor_id: string;
      full_name: string;
      value: number;
    } | null;
    best_rating: { tutor_id: string; full_name: string; value: number } | null;
    most_students: {
      tutor_id: string;
      full_name: string;
      value: number;
    } | null;
    most_xp: { user_id: string; full_name: string; value: number } | null;
  };
}

interface HallOfFameTabProps {
  stats: AdvancedStats | null;
  hofStartDate: string;
  setHofStartDate: (val: string) => void;
  hofEndDate: string;
  setHofEndDate: (val: string) => void;
  hofData: AdvancedStats["hall_of_fame"] | null;
  hofLoading: boolean;
}

export function HallOfFameTab({
  stats,
  hofStartDate,
  setHofStartDate,
  hofEndDate,
  setHofEndDate,
  hofData,
  hofLoading,
}: HallOfFameTabProps) {
  if (!stats) return null;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 bg-muted/30 p-4 rounded-lg border">
        <div>
          <h3 className="font-semibold text-lg">Timeframe Aggregation</h3>
          <p className="text-sm text-muted-foreground">
            Select a date range to calculate the Best Week, Best Month, and
            Overall Most Hours.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="grid gap-1">
            <Label htmlFor="start_date" className="text-xs">
              Start Date
            </Label>
            <Input
              type="date"
              id="start_date"
              value={hofStartDate}
              onChange={(e) => setHofStartDate(e.target.value)}
              className="w-[140px]"
            />
          </div>
          <span className="text-muted-foreground mt-4">-</span>
          <div className="grid gap-1">
            <Label htmlFor="end_date" className="text-xs">
              End Date
            </Label>
            <Input
              type="date"
              id="end_date"
              value={hofEndDate}
              onChange={(e) => setHofEndDate(e.target.value)}
              className="w-[140px]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-yellow-500/30 bg-yellow-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Timer className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-600 dark:text-yellow-500 text-sm">
              Best Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hofLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
            ) : (
              <>
                <p className="text-2xl font-black">
                  {hofData?.most_hours_week?.full_name || "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(hofData?.most_hours_week?.value
                    ? hofData.most_hours_week.value / 60
                    : 0
                  ).toFixed(1)}{" "}
                  Hours
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Timer className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-600 dark:text-yellow-500 text-sm">
              Best Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hofLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
            ) : (
              <>
                <p className="text-2xl font-black">
                  {hofData?.most_hours_month?.full_name || "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(hofData?.most_hours_month?.value
                    ? hofData.most_hours_month.value / 60
                    : 0
                  ).toFixed(1)}{" "}
                  Hours
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-600 dark:text-yellow-500 text-sm">
              Most Hours (Overall Period)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hofLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
            ) : (
              <>
                <p className="text-2xl font-black">
                  {hofData?.most_hours_semester?.full_name || "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(hofData?.most_hours_semester?.value
                    ? hofData.most_hours_semester.value / 60
                    : 0
                  ).toFixed(1)}{" "}
                  Hours
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-blue-500/30 bg-blue-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Star className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">
              Highest Rated Tutor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">
              {stats.hall_of_fame.best_rating?.full_name || "N/A"}
            </p>
            <p className="text-lg text-muted-foreground">
              {stats.hall_of_fame.best_rating?.value || 0} Average Rating
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardTitle className="text-green-600 dark:text-green-400">
              Most Unique Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">
              {stats.hall_of_fame.most_students?.full_name || "N/A"}
            </p>
            <p className="text-lg text-muted-foreground">
              {stats.hall_of_fame.most_students?.value || 0} Students Helped
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-purple-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Medal className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardTitle className="text-purple-600 dark:text-purple-400">
              Top Learner (Most XP)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">
              {stats.hall_of_fame.most_xp?.full_name || "N/A"}
            </p>
            <p className="text-lg text-muted-foreground">
              {stats.hall_of_fame.most_xp?.value || 0} XP Earned
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
