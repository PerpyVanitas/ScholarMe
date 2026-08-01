import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getLevelTitle,
  getLevelColor,
  getNextLevelXp,
  calculateLevel,
  getLevelProgress,
  earnXp,
  triggerConfetti,
} from "../gamification";

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

describe("Gamification Utils", () => {
  describe("getLevelTitle", () => {
    it("returns Novice for levels below 5", () => {
      expect(getLevelTitle(1)).toBe("Novice");
      expect(getLevelTitle(4)).toBe("Novice");
    });

    it("returns Scholar for levels 5 to 9", () => {
      expect(getLevelTitle(5)).toBe("Scholar");
      expect(getLevelTitle(9)).toBe("Scholar");
    });

    it("returns Prodigy for levels 10 to 19", () => {
      expect(getLevelTitle(10)).toBe("Prodigy");
      expect(getLevelTitle(19)).toBe("Prodigy");
    });

    it("returns Master for levels 20 to 49", () => {
      expect(getLevelTitle(20)).toBe("Master");
      expect(getLevelTitle(49)).toBe("Master");
    });

    it("returns Grandmaster for levels 50 and above", () => {
      expect(getLevelTitle(50)).toBe("Grandmaster");
      expect(getLevelTitle(100)).toBe("Grandmaster");
    });
  });

  describe("getLevelColor", () => {
    it("returns correct colors for levels", () => {
      expect(getLevelColor(1)).toContain("slate-500");
      expect(getLevelColor(5)).toContain("amber-600");
      expect(getLevelColor(10)).toContain("slate-300");
      expect(getLevelColor(20)).toContain("yellow-400");
      expect(getLevelColor(50)).toContain("purple-400");
    });
  });

  describe("getNextLevelXp", () => {
    it("calculates the correct XP requirements", () => {
      // Math.pow(level, 2) * 100
      expect(getNextLevelXp(1)).toBe(100);
      expect(getNextLevelXp(2)).toBe(400);
      expect(getNextLevelXp(5)).toBe(2500);
      expect(getNextLevelXp(10)).toBe(10000);
    });
  });

  describe("calculateLevel", () => {
    it("calculates the level accurately based on XP", () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(50)).toBe(1);
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(399)).toBe(2);
      expect(calculateLevel(400)).toBe(3);
    });
  });

  describe("getLevelProgress", () => {
    it("returns correct level progress metrics", () => {
      const progress = getLevelProgress(250);
      expect(progress.currentLevel).toBe(2);
      expect(progress.currentLevelMinXp).toBe(100);
      expect(progress.nextLevelMinXp).toBe(400);
      expect(progress.xpInCurrentLevel).toBe(150);
      expect(progress.xpForNextLevel).toBe(300);
      expect(progress.xpRemaining).toBe(150);
      expect(progress.progressPercent).toBe(50);
    });
  });

  describe("earnXp", () => {
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns success data on successful API response", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          xp_earned: 50,
          total_xp: 150,
        }),
      } as Response);

      const result = await earnXp("SESSION_COMPLETED", "Finished a session");

      expect(result.success).toBe(true);
      expect(result.xp_earned).toBe(50);
    });

    it("returns error when API responds with failure", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: "Rate limited" }),
      } as Response);

      const result = await earnXp("SESSION_COMPLETED", "Finished a session");

      expect(result).toEqual({ success: false, error: "Rate limited" });
      consoleSpy.mockRestore();
    });

    it("returns network error on fetch failure", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(fetch).mockRejectedValue(new Error("network down"));

      const result = await earnXp("SESSION_COMPLETED", "Finished a session");

      expect(result).toEqual({ success: false, error: "Network error" });
      consoleSpy.mockRestore();
    });

    it("triggers level-up vibration when current_level is returned", async () => {
      const vibrate = vi.fn();
      Object.defineProperty(globalThis, "window", {
        value: globalThis,
        configurable: true,
      });
      Object.defineProperty(navigator, "vibrate", {
        value: vibrate,
        configurable: true,
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          xp_earned: 100,
          current_level: 5,
        }),
      } as Response);

      await earnXp("SESSION_COMPLETED", "Level up");

      expect(vibrate).toHaveBeenCalledWith([200, 100, 200, 100, 400]);
    });
  });

  describe("triggerConfetti", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("starts confetti animation interval", async () => {
      const confetti = (await import("canvas-confetti")).default;

      triggerConfetti();
      vi.advanceTimersByTime(500);

      expect(confetti).toHaveBeenCalled();
    });
  });
});
