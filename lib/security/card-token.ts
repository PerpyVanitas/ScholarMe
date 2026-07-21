import crypto from "crypto";

/**
 * Get secret key for card HMAC signing.
 * Uses CARD_LOGIN_SECRET or falls back to SUPABASE_SERVICE_ROLE_KEY or default fallback for dev.
 */
function getCardSecret(): string {
  return (
    process.env.CARD_LOGIN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "scholarme-id-card-secure-salt-2026"
  );
}

/**
 * Generate a secure 64-character hex HMAC-SHA256 signature for a Card ID and PIN.
 * This prevents exposure of the plaintext PIN in printed QR codes.
 */
export function generateCardSignature(cardId: string, pin: string): string {
  const secret = getCardSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(`${cardId.trim()}:${pin.trim()}`)
    .digest("hex");
}

/**
 * Verify an incoming HMAC-SHA256 card signature.
 */
export function verifyCardSignature(
  cardId: string,
  pin: string,
  signature: string,
): boolean {
  if (!cardId || !pin || !signature) return false;
  const expectedSignature = generateCardSignature(cardId, pin);

  // Timing-safe comparison to prevent timing attacks
  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
