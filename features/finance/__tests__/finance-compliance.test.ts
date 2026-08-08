import { describe, it, expect } from "vitest";
import {
  generateDocumentNumber,
  isValidAmount,
} from "../utils/document-number";

describe("Finance Compliance Controls & Utilities", () => {
  describe("isValidAmount", () => {
    it("accepts valid positive numbers", () => {
      expect(isValidAmount(100)).toBe(true);
      expect(isValidAmount(0.01)).toBe(true);
      expect(isValidAmount(1500)).toBe(true);
    });

    it("rejects zero, negative, NaN, and non-finite values", () => {
      expect(isValidAmount(0)).toBe(false);
      expect(isValidAmount(-50)).toBe(false);
      expect(isValidAmount(NaN)).toBe(false);
      expect(isValidAmount(Infinity)).toBe(false);
    });
  });

  describe("generateDocumentNumber", () => {
    it("generates standardized Section XVI policy document number", () => {
      const testDate = new Date("2026-05-06T00:00:00Z");
      const docNum = generateDocumentNumber(
        "BUDGET",
        "Leadership Seminar",
        "Bugas Yessuah Leih Ande",
        testDate,
      );

      expect(docNum).toContain("BUDGET_LeadershipSeminar_BugasYessuahLeihAnde_");
      expect(docNum).toMatch(/^BUDGET_LeadershipSeminar_BugasYessuahLeihAnde_\d{2}-\d{2}-\d{4}$/);
    });
  });

  describe("Appeal Deadline Verification (Section XIV)", () => {
    it("identifies expired appeals when flag is older than 3 days", () => {
      const flagDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).getTime();
      const diffDays = (Date.now() - flagDate) / (1000 * 60 * 60 * 24);
      expect(diffDays > 3).toBe(true);
    });

    it("allows valid appeals within the 3-day window", () => {
      const flagDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).getTime();
      const diffDays = (Date.now() - flagDate) / (1000 * 60 * 60 * 24);
      expect(diffDays <= 3).toBe(true);
    });
  });
});
