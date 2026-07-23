"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Clock, QrCode, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function PlcLiveDeskWidget() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [activeTutorsCount, setActiveTutorsCount] = useState(0);
  const [learnersCheckedInCount, setLearnersCheckedInCount] = useState(0);
  const [estWaitMinutes, setEstWaitMinutes] = useState(0);

  useEffect(() => {
    async function loadPlcState() {
      try {
        setLoading(true);
        // Query active unclosed attendance logs for today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: logs } = await supabase
          .from("attendance_logs")
          .select("user_id, profiles:user_id(roles:role_id(name))")
          .gte("clock_in", todayStart.toISOString())
          .is("clock_out", null);

        if (logs) {
          let tutorCount = 0;
          let learnerCount = 0;

          logs.forEach((log) => {
            const roleName = (log.profiles as unknown as { roles?: { name?: string } })?.roles?.name;
            if (roleName === "tutor" || roleName === "administrator" || roleName === "super_admin") {
              tutorCount += 1;
            } else {
              learnerCount += 1;
            }
          });

          setActiveTutorsCount(tutorCount);
          setLearnersCheckedInCount(learnerCount);

          // Dynamic wait calculation: 15 mins per waiting learner per tutor ratio
          if (tutorCount === 0) {
            setEstWaitMinutes(learnerCount > 0 ? 30 : 0);
          } else {
            const ratio = Math.ceil(learnerCount / tutorCount);
            setEstWaitMinutes(Math.max(0, ratio * 10));
          }
        }
      } catch (err) {
        console.error("Error loading PLC live desk state:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPlcState();
  }, [supabase]);

  if (loading) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">PLC Live Desk Activity</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Live Status
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Peer Learning Center physical facility headcount and drop-in availability.
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
          <div className="text-center">
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Users className="h-3.5 w-3.5 text-primary" /> Active Tutors
            </div>
            <div className="font-bold text-base text-foreground mt-0.5">{activeTutorsCount} On Shift</div>
          </div>

          <div className="text-center border-l pl-4 sm:pl-6">
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" /> Est. Drop-in Wait
            </div>
            <div className="font-bold text-base text-foreground mt-0.5">
              {estWaitMinutes === 0 ? "No Wait" : `~${estWaitMinutes} mins`}
            </div>
          </div>

          <Button asChild size="sm" variant="default" className="text-xs gap-1.5 shrink-0 hidden md:inline-flex">
            <Link href="/dashboard/admin/users">
              <QrCode className="h-3.5 w-3.5" /> Check In
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
