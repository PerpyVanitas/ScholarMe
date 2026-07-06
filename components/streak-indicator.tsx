"use client";

import { Flame } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StreakIndicatorProps {
  currentStreak: number;
}

export function StreakIndicator({ currentStreak }: StreakIndicatorProps) {
  // If streak is 0, we can still show a gray flame or hide it. Let's show a gray flame.
  const isActive = currentStreak > 0;

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
