"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { calculateDailyStreakXp } from "@/lib/utils/gamification";

export function StreakIndicator() {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    async function checkDailyLogin() {
      try {
        const res = await fetch("/api/v1/gamification/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data.success) {
          const streak = data.streak || 1;
          setCurrentStreak(streak);
          setIsActive(streak > 0);

          if (data.is_first_claim_today && data.xp_earned > 0) {
            toast.success("🔥 Daily Check-In Bonus!", {
              description: `+${data.xp_earned} XP earned (${streak} Day Streak)`,
            });

            // Dispatch event to update UserContext live
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("xp_earned", {
                  detail: {
                    total_xp: data.total_xp,
                    current_level: data.current_level,
                    xp_earned: data.xp_earned,
                  },
                }),
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to check daily login:", err);
      }
    }

    checkDailyLogin();
  }, []);

  const todayXp = calculateDailyStreakXp(currentStreak);
  const nextXp = calculateDailyStreakXp(currentStreak + 1);

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
        <TooltipContent side="bottom" className="text-sm max-w-xs space-y-1">
          <p className="font-semibold">
            {isActive
              ? `🔥 ${currentStreak} Day Learning Streak!`
              : "Log in daily to build your streak!"}
          </p>
          <p className="text-xs text-muted-foreground">
            Current Bonus: <span className="font-bold text-foreground">{todayXp} XP/day</span>
            {currentStreak < 30 ? (
              <span> · Next: <span className="text-primary font-semibold">{nextXp} XP</span></span>
            ) : (
              <span> · <span className="text-amber-500 font-semibold">Max 100 XP (Day 30 Capped)</span></span>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
