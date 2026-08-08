import confetti from "canvas-confetti";
import { XP_AWARDS } from "@/lib/constants";

export function triggerConfetti() {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const interval: ReturnType<typeof setInterval> = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      }),
    );
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      }),
    );
  }, 250);
}

export function getLevelTitle(level: number): string {
  if (level < 5) return "Novice";
  if (level < 10) return "Scholar";
  if (level < 20) return "Prodigy";
  if (level < 50) return "Master";
  return "Grandmaster";
}

export function getLevelColor(level: number): string {
  if (level < 5) return "border-slate-500 bg-slate-500/20 text-slate-200"; // Novice: Grey
  if (level < 10) return "border-amber-600 bg-amber-600/20 text-amber-500"; // Scholar: Bronze
  if (level < 20) return "border-slate-300 bg-slate-300/20 text-slate-300"; // Prodigy: Silver
  if (level < 50) return "border-yellow-400 bg-yellow-400/20 text-yellow-400"; // Master: Gold
  return "border-purple-400 bg-purple-400/20 text-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.3)]"; // Grandmaster: Glowing Purple
}

/**
 * Calculates level from total XP using PostgreSQL DB formula:
 * Level = floor(0.1 * sqrt(total_xp)) + 1
 */
export function calculateLevel(totalXp: number): number {
  if (totalXp <= 0) return 1;
  return Math.floor(0.1 * Math.sqrt(totalXp)) + 1;
}

/**
 * Returns the total XP needed to reach the NEXT level from the current one.
 * Formula aligned with lib/gamification-utils.ts: level² × 100
 */
export function getNextLevelXp(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100;
}

export interface LevelProgress {
  currentLevel: number;
  currentLevelMinXp: number;
  nextLevelMinXp: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  xpRemaining: number;
  progressPercent: number;
}

/**
 * Calculates granular level progress metrics for UI progress bars and cards.
 */
export function getLevelProgress(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, totalXp || 0);
  const currentLevel = calculateLevel(safeXp);
  const currentLevelMinXp = Math.pow(currentLevel - 1, 2) * 100;
  const nextLevelMinXp = Math.pow(currentLevel, 2) * 100;
  const xpInCurrentLevel = safeXp - currentLevelMinXp;
  const xpForNextLevel = nextLevelMinXp - currentLevelMinXp;
  const xpRemaining = Math.max(0, nextLevelMinXp - safeXp);
  const progressPercent = Math.min(
    100,
    Math.max(0, (xpInCurrentLevel / xpForNextLevel) * 100),
  );

  return {
    currentLevel,
    currentLevelMinXp,
    nextLevelMinXp,
    xpInCurrentLevel,
    xpForNextLevel,
    xpRemaining,
    progressPercent,
  };
}

export interface EarnXpResult {
  success: boolean;
  xp_earned?: number;
  total_xp?: number;
  current_level?: number;
  error?: string;
}

/**
 * Awards XP to the current user via the API.
 * @param action - Must be a key in XP_AWARDS constants (e.g. "SESSION_COMPLETED")
 * @param reason - Human-readable description shown in XP logs
 */
export async function earnXp(
  action: keyof typeof XP_AWARDS,
  reason: string,
): Promise<EarnXpResult> {
  try {
    const res = await fetch("/api/v1/xp/earn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    const data: EarnXpResult = await res.json();

    if (!res.ok) {
      console.error("XP earn API error:", data.error);
      return { success: false, error: data.error };
    }

    if (data.success && typeof window !== "undefined") {
      // Broadcast custom event so active UI components (UserContext, dashboards, etc.) update live
      window.dispatchEvent(
        new CustomEvent("xp_earned", {
          detail: data,
        }),
      );

      // Trigger haptic feedback for success or level up
      if ("vibrate" in navigator) {
        if (data.current_level) {
          navigator.vibrate([200, 100, 200, 100, 400]); // Long celebration vibration
        } else {
          navigator.vibrate([100, 50, 100]); // Short success vibration
        }
      }
    }

    return data;
  } catch (error) {
    console.error("Failed to earn XP:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Calculates Daily Login XP award based on consecutive day streak.
 * - Base XP: 50 XP (Day 1)
 * - Streak scaling: linearly increases up to Day 30 (Day 30 = 100 XP)
 * - Cap: streak multiplier capped at Day 30 (Day 31+ stays at 100 XP)
 */
export function calculateDailyStreakXp(streak: number): number {
  const safeStreak = Math.max(1, Math.floor(streak || 1));
  const effectiveStreak = Math.min(30, safeStreak);
  const baseXp = XP_AWARDS.DAILY_LOGIN; // 50
  const maxBonus = 50; // Reaches 100 XP total at Day 30
  const streakBonus = Math.round((effectiveStreak - 1) * (maxBonus / 29));
  return baseXp + streakBonus;
}
