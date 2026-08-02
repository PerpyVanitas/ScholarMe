import { describe, it, expect } from "vitest";
import {
  formatFinanceNotification,
  checkPettyCashReplenishment,
  isLiquidationLate,
} from "../finance-notifications";

describe("Finance Notification Helpers", () => {
  it("formats notification with correct icon badge", () => {
    const formatted = formatFinanceNotification({
      type: "flag_issued",
      title: "Yellow Flag Issued",
      message: "Late liquidation submission",
      recipientId: "user-123",
    });

    expect(formatted.formattedTitle).toBe("⚠️ Yellow Flag Issued");
    expect(formatted.recipientId).toBe("user-123");
    expect(formatted.createdAt).toBeDefined();
  });

  it("identifies low petty cash replenishment threshold correctly", () => {
    expect(checkPettyCashReplenishment(250, 300)).toBe(true);
    expect(checkPettyCashReplenishment(500, 300)).toBe(false);
  });

  it("evaluates late liquidation window (>7 days)", () => {
    const completion = new Date("2026-08-01");
    const onTime = new Date("2026-08-05");
    const late = new Date("2026-08-10");

    expect(isLiquidationLate(onTime, completion, 7)).toBe(false);
    expect(isLiquidationLate(late, completion, 7)).toBe(true);
  });
});
