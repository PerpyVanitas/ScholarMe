import confetti from "canvas-confetti";

export function triggerConfetti() {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
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
