import { describe, it, expect } from "vitest";
import {
  generateCardSignature,
  verifyCardSignature,
} from "@/lib/security/card-token";

describe("Card Token Security (HMAC Option 2)", () => {
  it("should generate deterministic 64-char hex HMAC-SHA256 signature", () => {
    const sig1 = generateCardSignature("HS-2026-0001", "1234");
    const sig2 = generateCardSignature("HS-2026-0001", "1234");

    expect(sig1).toHaveLength(64);
    expect(sig1).toBe(sig2);
  });

  it("should generate different signatures for different cards or PINs", () => {
    const sig1 = generateCardSignature("HS-2026-0001", "1234");
    const sig2 = generateCardSignature("HS-2026-0002", "1234");
    const sig3 = generateCardSignature("HS-2026-0001", "5678");

    expect(sig1).not.toBe(sig2);
    expect(sig1).not.toBe(sig3);
  });

  it("should verify valid signatures and reject tampered ones", () => {
    const cardId = "HS-2026-9999";
    const pin = "9876";
    const validSig = generateCardSignature(cardId, pin);

    expect(verifyCardSignature(cardId, pin, validSig)).toBe(true);
    expect(verifyCardSignature(cardId, "0000", validSig)).toBe(false);
    expect(verifyCardSignature("HS-2026-0000", pin, validSig)).toBe(false);
    expect(verifyCardSignature(cardId, pin, "tampered-signature-12345")).toBe(
      false,
    );
  });
});
