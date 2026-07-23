"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, TutorEndorsement } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HeartHandshake, Users, Clock, MessageSquareQuote } from "lucide-react";

interface TutorImpactWidgetProps {
  profile: Profile;
}

export function TutorImpactWidget({ profile }: TutorImpactWidgetProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [studentsHelpedCount, setStudentsHelpedCount] = useState(0);
  const [totalHoursTutored, setTotalHoursTutored] = useState(0);
  const [endorsements, setEndorsements] = useState<TutorEndorsement[]>([]);

  useEffect(() => {
    async function loadImpactData() {
      try {
        setLoading(true);
        // 1. Unique students tutored
        const { data: completedSessions } = await supabase
          .from("sessions")
          .select("learner_id")
          .eq("tutor_id", profile.id)
          .eq("status", "completed");

        if (completedSessions) {
          const uniqueLearners = new Set(completedSessions.map((s) => s.learner_id));
          setStudentsHelpedCount(uniqueLearners.size);
        }

        // 2. Attendance hours
        const { data: attendance } = await supabase
          .from("attendance_logs")
          .select("clock_in, clock_out")
          .eq("user_id", profile.id)
          .not("clock_out", "is", null);

        let totalMins = 0;
        attendance?.forEach((log) => {
          if (log.clock_in && log.clock_out) {
            const start = new Date(log.clock_in).getTime();
            const end = new Date(log.clock_out).getTime();
            totalMins += Math.max(0, (end - start) / (1000 * 60));
          }
        });
        const hours = (completedSessions?.length || 0) + Math.round(totalMins / 60);
        setTotalHoursTutored(hours);

        // 3. Endorsements given to learners
        const { data: endos } = await supabase
          .from("tutor_endorsements")
          .select("*, learner:profiles!tutor_endorsements_learner_id_fkey(full_name)")
          .eq("tutor_id", profile.id);

        setEndorsements(endos || []);
      } catch (err) {
        console.error("Error loading tutor impact:", err);
      } finally {
        setLoading(false);
      }
    }

    loadImpactData();
  }, [profile.id, supabase]);

  if (loading) return null;

  return (
    <Card className="border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <HeartHandshake className="h-5 w-5 text-primary" /> Your Tutoring Impact
        </CardTitle>
        <CardDescription className="text-xs">
          Downstream effect of your contribution to the CIT-U Honor Society Peer Learning Center.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg border bg-muted/20">
            <Users className="h-4 w-4 mx-auto text-primary mb-1" />
            <div className="text-xl font-bold">{studentsHelpedCount}</div>
            <div className="text-[10px] text-muted-foreground">Students Helped</div>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20">
            <Clock className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
            <div className="text-xl font-bold">{totalHoursTutored}</div>
            <div className="text-[10px] text-muted-foreground">Hours Given</div>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20">
            <MessageSquareQuote className="h-4 w-4 text-amber-500 mx-auto mb-1" />
            <div className="text-xl font-bold">{endorsements.length}</div>
            <div className="text-[10px] text-muted-foreground">Endorsements Left</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
