/**
 * Gamification logic for level calculation.
 * Formula: Level = Floor(Sqrt(XP / 100)) + 1
 * 
 * Example:
 * 0 XP -> Lvl 1
 * 100 XP -> Lvl 2
 * 400 XP -> Lvl 3
 * 900 XP -> Lvl 4
 */
export function calculateLevel(xp: number): number {
  if (xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Returns the XP required for the next level.
 */
export function xpForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100;
}
