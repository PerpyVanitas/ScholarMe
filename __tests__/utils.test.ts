import { describe, it, expect } from "vitest";

// ─── Utility: formatDate ────────────────────────────────────────────────────
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ─── Utility: truncate ─────────────────────────────────────────────────────
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

// ─── Utility: calculateLevel ───────────────────────────────────────────────
// Mirrors the XP scaling curve used in Supabase: Level = FLOOR(0.1 * SQRT(total_xp)) + 1
function calculateLevel(totalXp: number): number {
  return Math.floor(0.1 * Math.sqrt(totalXp)) + 1;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("formats a date to YYYY-MM-DD", () => {
    const date = new Date("2026-07-06T10:00:00Z");
    expect(formatDate(date)).toBe("2026-07-06");
  });
});

describe("truncate", () => {
  it("returns the original string if within limit", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("truncates long strings and appends ellipsis", () => {
    expect(truncate("Hello World", 5)).toBe("Hello…");
  });

  it("returns the string unchanged if exactly at the limit", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });
});

describe("calculateLevel (XP Scaling Curve)", () => {
  it("returns level 1 at 0 XP", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("returns level 1 at 99 XP", () => {
    expect(calculateLevel(99)).toBe(1);
  });

  it("returns level 2 at 100 XP", () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it("returns level 11 at 10000 XP", () => {
    expect(calculateLevel(10000)).toBe(11);
  });
});

import { formatCurrency } from "@/lib/utils";

describe("formatCurrency (Philippine Peso ₱)", () => {
  it("formats numbers to Philippine Peso currency format", () => {
    const formatted = formatCurrency(5000);
    expect(formatted).toContain("5,000.00");
    expect(formatted).toMatch(/₱|PHP/);
  });

  it("handles 0 and null amounts gracefully", () => {
    expect(formatCurrency(0)).toContain("0.00");
    expect(formatCurrency(null)).toContain("0.00");
    expect(formatCurrency(undefined)).toContain("0.00");
  });
});

