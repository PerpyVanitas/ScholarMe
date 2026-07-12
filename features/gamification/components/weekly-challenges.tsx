"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  current_progress: number;
  xp_reward_multiplier: number;
  end_date: string;
}

export function WeeklyChallenges() {
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    async function loadChallenge() {
      const supabase = createClient();
      const { data } = await supabase
        .from("weekly_challenges")
        .select("*")
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) setChallenge(data);
      setLoading(false);
    }
    loadChallenge();
  }, []);

  if (loading) return null;

  if (!challenge) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Global Weekly Challenge
          </CardTitle>
          <CardDescription>No active challenge this week.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const percent = Math.min(100, Math.round((challenge.current_progress / challenge.target_amount) * 100));
  const daysLeft = now ? Math.max(0, Math.ceil((new Date(challenge.end_date).getTime() - now) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <Card className="border-primary/30 bg-primary/[0.03] overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Global Weekly Challenge
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-background">
            {daysLeft} days left
          </Badge>
        </div>
        <CardDescription>{challenge.title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex justify-between items-center text-sm font-medium">
            <span>{challenge.current_progress.toLocaleString()} / {challenge.target_amount.toLocaleString()}</span>
            <span className="text-primary">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2" />
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Zap className="h-3 w-3 text-orange-500 fill-orange-500" />
            Reward: {challenge.xp_reward_multiplier}x Global XP Multiplier!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
