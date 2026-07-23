"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Calendar, Award, Zap } from "lucide-react";

interface WeeklyDigestBannerProps {
  profile: Profile;
}

export function WeeklyDigestBanner({ profile }: WeeklyDigestBannerProps) {
  const supabase = createClient();
  const [digest, setDigest] = useState<string | null>(null);

  useEffect(() => {
    async function computeWeeklyDigest() {
      try {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const isoStart = startOfWeek.toISOString();

        // 1. Fetch weekly sessions
        const { data: sessions } = await supabase
          .from("sessions")
          .select("id")
          .or(`tutor_id.eq.${profile.id},learner_id.eq.${profile.id}`)
          .eq("status", "completed")
          .gte("scheduled_date", isoStart.split("T")[0]);

        // 2. Fetch weekly XP
        const { data: xpLogs } = await supabase
          .from("xp_events")
          .select("amount")
          .eq("user_id", profile.id)
          .gte("created_at", isoStart);

        const weeklyXp = xpLogs?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const sessionCount = sessions?.length || 0;

        let narrative = "";
        if (sessionCount === 0 && weeklyXp === 0) {
          narrative = `Welcome to the new week, ${profile.first_name || profile.full_name}! Ready to jump into your next study session or flashcard practice?`;
        } else {
          narrative = `This week, you completed ${sessionCount} session${sessionCount !== 1 ? "s" : ""}, earned ${weeklyXp} XP, and kept your study momentum going strong!`;
        }

        setDigest(narrative);
      } catch (err) {
        console.error("Error computing weekly digest:", err);
      }
    }

    computeWeeklyDigest();
  }, [profile, supabase]);

  if (!digest) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/20 text-primary shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-0.5 text-xs">
          <span className="font-semibold text-primary uppercase tracking-wider text-[10px]">Weekly Digest</span>
          <p className="text-foreground/90 font-medium leading-relaxed">{digest}</p>
        </div>
      </CardContent>
    </Card>
  );
}
