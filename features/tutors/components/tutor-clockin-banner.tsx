"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, LogIn, LogOut, Loader2, AlertTriangle } from "lucide-react";
import type { Tutor } from "@/lib/types";

interface TutorClockInBannerProps {
  tutor: Tutor | null;
  clockCheckDone: boolean;
  clockedIn: boolean;
  clockInTime: string | null;
  clockingIn: boolean;
  isLongClockIn: boolean;
  elapsedStr: string;
  onClockIn: () => void;
  onClockOut: () => void;
}

export function TutorClockInBanner({
  tutor,
  clockCheckDone,
  clockedIn,
  clockInTime,
  clockingIn,
  isLongClockIn,
  elapsedStr,
  onClockIn,
  onClockOut,
}: TutorClockInBannerProps) {
  if (!tutor || !clockCheckDone) return null;

  return (
    <Card
      className={`border-border/60 ${isLongClockIn ? "border-destructive/50 ring-1 ring-destructive/20" : ""}`}
    >
      <CardContent className="flex flex-col p-4 gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                clockedIn
                  ? isLongClockIn
                    ? "bg-destructive/10"
                    : "bg-green-500/10"
                  : "bg-muted"
              }`}
            >
              <Timer
                className={`h-5 w-5 ${
                  clockedIn
                    ? isLongClockIn
                      ? "text-destructive"
                      : "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">PLC Duty Clock-in</span>
                {clockedIn ? (
                  <Badge
                    variant="outline"
                    className={
                      isLongClockIn
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                    }
                  >
                    {isLongClockIn ? "Shift Exceeded (12h+)" : "On Shift"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Off Duty
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {clockedIn
                  ? isLongClockIn
                    ? "Your shift has run longer than 12 hours. Please confirm clock-out."
                    : `Clocked in at ${new Date(clockInTime!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Clock in when starting your scheduled PLC tutoring shift."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {clockedIn && (
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-semibold">
                  Shift Duration
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {elapsedStr}
                </span>
              </div>
            )}

            {clockedIn ? (
              <Button
                variant={isLongClockIn ? "destructive" : "outline"}
                size="sm"
                onClick={onClockOut}
                disabled={clockingIn}
                className="gap-1.5"
              >
                {clockingIn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Clock Out
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onClockIn}
                disabled={clockingIn}
                className="gap-1.5"
              >
                {clockingIn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                Clock In
              </Button>
            )}
          </div>
        </div>

        {isLongClockIn && (
          <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Shift duration threshold exceeded. Please log your clock-out to ensure accurate duty hour logging.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
