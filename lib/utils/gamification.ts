export function getLevelTitle(level: number): string {
  if (level < 5) return "Novice";
  if (level < 10) return "Scholar";
  if (level < 20) return "Prodigy";
  if (level < 50) return "Master";
  return "Grandmaster";
}

export function getLevelColor(level: number): string {
  if (level < 5) return "border-slate-700 bg-slate-900"; // Novice: Basic dark border
  if (level < 10) return "border-amber-700 bg-amber-900/30"; // Scholar: Bronze
  if (level < 20) return "border-slate-300 bg-slate-200/30"; // Prodigy: Silver
  if (level < 50) return "border-yellow-500 bg-yellow-500/20"; // Master: Gold
  return "border-purple-500 bg-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.5)]"; // Grandmaster: Glowing Purple
}

export function getNextLevelXp(currentLevel: number): number {
  return Math.pow(10 * currentLevel, 2);
}

export async function earnXp(amount: number, reason: string) {
  try {
    const res = await fetch("/api/xp/earn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, reason })
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Failed to earn XP:", error);
    return { success: false };
  }
}
