import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: mockSend };
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { sendEmail } from "../email";

describe("sendEmail", () => {
  const originalKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalKey) {
      process.env.RESEND_API_KEY = originalKey;
    } else {
      delete process.env.RESEND_API_KEY;
    }
  });

  it("skips sending when RESEND_API_KEY is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Welcome",
      html: "<p>Hello</p>",
    });

    expect(result).toEqual({ success: true, dummy: true });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends email when API key is configured", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockResolvedValue({ id: "email-1" });

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Welcome",
      html: "<p>Hello</p>",
    });

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledWith({
      from: "ScholarMe <onboarding@resend.dev>",
      to: "user@example.com",
      subject: "Welcome",
      html: "<p>Hello</p>",
    });
  });

  it("returns failure when Resend throws", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockRejectedValue(new Error("send failed"));

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Welcome",
      html: "<p>Hello</p>",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});
