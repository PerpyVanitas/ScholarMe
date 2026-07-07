"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { tryUnlockBadge } from "@/lib/utils/badges";

export function StreakIndicator() {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStreak() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Optimistic create or fetch
      const { data, error } = await supabase
        .from("user_streaks")
        .select("current_streak, last_login_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) {
        // First time
        await supabase
          .from("user_streaks")
          .insert({ user_id: user.id, current_streak: 1 });
        setCurrentStreak(1);
        setIsActive(true);
      } else {
        const lastLogin = new Date(data.last_login_date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastLogin.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let newStreak = data.current_streak;
        if (diffDays === 1) {
          // Logged in next day, increment
          newStreak += 1;
          await supabase
            .from("user_streaks")
            .update({
              current_streak: newStreak,
              last_login_date: today.toISOString(),
            })
            .eq("user_id", user.id);
        } else if (diffDays > 1) {
          // Streak broken
          newStreak = 1;
          await supabase
            .from("user_streaks")
            .update({ current_streak: 1, last_login_date: today.toISOString() })
            .eq("user_id", user.id);
        }

        setCurrentStreak(newStreak);
        setIsActive(newStreak > 0);

        if (newStreak >= 7) {
          await tryUnlockBadge(supabase, user.id, "week_warrior");
        }
      }
    }

    fetchStreak();
  }, [supabase]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors cursor-default ${
              isActive
                ? "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-500"
                : "bg-muted border-border text-muted-foreground"
            }`}
          >
            <Flame
              className={`h-4 w-4 ${isActive ? "fill-orange-500/20 text-orange-500" : ""}`}
            />
            <span className="font-bold text-sm">{currentStreak}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-sm">
          <p>
            {isActive
              ? `You're on a ${currentStreak} day learning streak!`
              : "Complete a study session to start your streak!"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
