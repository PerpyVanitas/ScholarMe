"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/lib/user-context";
import { Button } from "@/components/ui/button";

interface DailyQuest {
  id: string;
  quest_type: string;
  target: number;
  progress: number;
  completed: boolean;
  xp_reward: number;
  expires_at: string;
}

export function DailyQuests() {
  const { profile } = useUser();
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuests() {
      if (!profile) return;
      const supabase = createClient();

      const { data, error } = await supabase
        .from("daily_quests")
        .select("*")
        .eq("user_id", profile.id)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (!error && data) {
        setQuests(data);
      } else {
        setQuests([]);
      }
      setLoading(false);
    }
    loadQuests();
  }, [profile]);

  if (loading || quests.length === 0) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" /> Daily Quests
        </CardTitle>
        <CardDescription>Complete quests to earn bonus XP</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mt-2">
          {quests.map((quest) => {
            const percent = Math.min(
              100,
              Math.round((quest.progress / quest.target) * 100),
            );
            return (
              <div key={quest.id} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    {quest.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                    )}
                    <span
                      className={
                        quest.completed
                          ? "text-muted-foreground line-through"
                          : "font-medium"
                      }
                    >
                      {quest.quest_type}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    +{quest.xp_reward} XP
                  </Badge>
                </div>
                {!quest.completed && (
                  <Progress value={percent} className="h-1.5" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
