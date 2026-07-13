import { describe, it, expect } from "vitest";
import { getLevelTitle, getLevelColor, getNextLevelXp } from "../gamification";

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
});
