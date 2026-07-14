import { describe, it, expect } from "vitest";
import { roundCurrency, isValidFileType } from "../utils";

describe("Finance Utils", () => {
  it("P2-4: Floating point precision sums correctly", () => {
    // Standard JS float issue: 0.1 + 0.2 = 0.30000000000000004
    const val = 0.1 + 0.2;
    expect(val).not.toBe(0.3); // Demonstrates the problem
    expect(roundCurrency(val)).toBe(0.3); // Our solution
  });

  it("P2-5: Currency rounding fixes extended decimals", () => {
    expect(roundCurrency(10.12345)).toBe(10.12);
    expect(roundCurrency(10.125)).toBe(10.13);
    expect(roundCurrency(10.0)).toBe(10);
  });

  it("P2-6: Receipt file type by content, not filename", async () => {
    // PDF Magic Number
    const pdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00]);
    const pdfFile = new File([pdfBuffer], "test.pdf", {
      type: "application/pdf",
    });
    expect(await isValidFileType(pdfFile)).toBe(true);

    // Fake PDF (doesn't start with %PDF)
    const fakePdfBuffer = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x00]);
    const fakePdfFile = new File([fakePdfBuffer], "fake.pdf", {
      type: "application/pdf",
    });
    expect(await isValidFileType(fakePdfFile)).toBe(false);

    // JPEG Magic Number
    const jpegBuffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    const jpegFile = new File([jpegBuffer], "test.jpg", { type: "image/jpeg" });
    expect(await isValidFileType(jpegFile)).toBe(true);

    // PNG Magic Number
    const pngBuffer = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const pngFile = new File([pngBuffer], "test.png", { type: "image/png" });
    expect(await isValidFileType(pngFile)).toBe(true);
  });

  it("P2-9: Leap year budget rollover", () => {
    // Ensures month rollovers over leap years don't break simple date math
    const leapDate = new Date("2024-02-29T12:00:00Z");
    const nextMonth = new Date(leapDate);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

    // JS date shifts to March 29 correctly without throwing an error
    expect(nextMonth.getUTCMonth()).toBe(2); // March is 0-indexed as 2
    expect(nextMonth.getUTCDate()).toBe(29);
  });
});
