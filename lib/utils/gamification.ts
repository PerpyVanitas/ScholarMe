import confetti from "canvas-confetti";
import { XP_AWARDS } from "@/lib/constants";

export function triggerConfetti() {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  // Use ReturnType<typeof setInterval> instead of any
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
 * Returns the XP needed to reach the NEXT level from the current one.
 * Formula aligned with lib/gamification-utils.ts: level² × 100
 * (was previously (10*level)² which gave wildly different results)
 */
export function getNextLevelXp(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100;
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
export async function earnXp(action: keyof typeof XP_AWARDS, reason: string): Promise<EarnXpResult> {
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

    // Trigger haptic feedback for success or level up
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      if (data.current_level) {
        navigator.vibrate([200, 100, 200, 100, 400]); // Long celebration vibration
      } else {
        navigator.vibrate([100, 50, 100]); // Short success vibration
      }
    }

    return data;
  } catch (error) {
    console.error("Failed to earn XP:", error);
    return { success: false, error: "Network error" };
  }
}
