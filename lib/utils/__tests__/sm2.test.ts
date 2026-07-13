import { describe, it, expect } from "vitest";
import { calculateSM2 } from "../sm2";

describe("SM2 Algorithm", () => {
  it("should initialize correctly on first review with perfect score", () => {
    const result = calculateSM2(5, 0, 0, 2.5);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  it("should increase interval to 6 on second consecutive perfect score", () => {
    const result = calculateSM2(5, 1, 1, 2.6);
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
  });

  it("should multiply interval by ease factor on third perfect score", () => {
    const result = calculateSM2(5, 2, 6, 2.6);
    expect(result.interval).toBe(Math.round(6 * 2.6)); // 16
    expect(result.repetitions).toBe(3);
  });

  it("should reset repetitions and set interval to 1 on failure (quality < 3)", () => {
    const result = calculateSM2(2, 5, 20, 2.5);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  it("should not let ease factor drop below 1.3", () => {
    const result = calculateSM2(0, 5, 20, 1.3);
    expect(result.easeFactor).toBe(1.3);
  });

  it("should adjust ease factor depending on quality", () => {
    // Quality 4 (hesitation) keeps ease factor the same
    const q4 = calculateSM2(4, 2, 6, 2.5);
    expect(q4.easeFactor).toBe(2.5);

    // Quality 3 (difficult) should decrease ease factor
    const q3 = calculateSM2(3, 2, 6, 2.5);
    expect(q3.easeFactor).toBeLessThan(2.5);
  });
});
