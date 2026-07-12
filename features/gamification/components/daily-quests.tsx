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

      // Auto-generate quests if they don't exist for today (Mock logic for demo)
      const { data } = await supabase
        .from("daily_quests")
        .select("*")
        .eq("user_id", profile.id)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setQuests(data);
      } else {
        // Generate new quests for today and save to database
        const tomorrow = new Date();
        tomorrow.setHours(23, 59, 59, 999);

        const newQuests = [
          {
            user_id: profile.id,
            quest_type: "Complete 1 Tutoring Session",
            target: 1,
            progress: 0,
            completed: false,
            xp_reward: 50,
            expires_at: tomorrow.toISOString(),
          },
          {
            user_id: profile.id,
            quest_type: "Answer 5 Flashcards",
            target: 5,
            progress: 0,
            completed: false,
            xp_reward: 20,
            expires_at: tomorrow.toISOString(),
          },
        ];

        const { data: insertedQuests, error } = await supabase
          .from("daily_quests")
          .insert(newQuests)
          .select();

        if (!error && insertedQuests) {
          setQuests(insertedQuests);
        }
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
