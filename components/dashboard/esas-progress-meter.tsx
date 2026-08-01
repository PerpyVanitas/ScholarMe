"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, ShieldCheck, Award } from "lucide-react";

interface EsasProgressMeterProps {
  tutoringHours: number;
  serviceHours: number;
  targetHours?: number;
  isCommitteeHead?: boolean;
}

export function EsasProgressMeter({
  tutoringHours,
  serviceHours,
  targetHours = 90,
  isCommitteeHead = false,
}: EsasProgressMeterProps) {
  const totalHours = tutoringHours + serviceHours;
  const percentage = Math.min(100, Math.round((totalHours / targetHours) * 100));

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          ESAS Service Hour Requirement
        </CardTitle>
        {isCommitteeHead ? (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            90-Hr Exemption Applied
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            {totalHours} / {targetHours} hrs
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isCommitteeHead ? (
          <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 border border-emerald-500/20">
            <Award className="h-4 w-4 flex-shrink-0" />
            <span>
              As a Committee Head, your requirement is automatically marked complete via leadership exemption.
            </span>
          </div>
        ) : (
          <>
            <Progress value={percentage} className="h-2.5" />
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1 rounded-md border border-border/50 p-2.5 bg-muted/30">
                <span className="text-muted-foreground font-medium">Tutoring Hours</span>
                <span className="text-sm font-bold text-foreground">{tutoringHours} hrs</span>
              </div>
              <div className="flex flex-col gap-1 rounded-md border border-border/50 p-2.5 bg-muted/30">
                <span className="text-muted-foreground font-medium">Committee Service</span>
                <span className="text-sm font-bold text-foreground">{serviceHours} hrs</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
