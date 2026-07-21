import { handleApiError } from "@/lib/utils/api-error";
/** POST /api/auth/card-login -- authenticate via Card ID + PIN (uses admin client to bypass RLS). */
import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-errors";
import { normalizeRole } from "@/lib/utils/roles";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";
import { verifyCardSignature } from "@/lib/security/card-token";

const cardLoginRateLimiter = rateLimit({ interval: 10 * 60 * 1000, limit: 10 });
export async function POST(request: Request) {
  try {
    const { cardId, pin, sig } = await request.json();

    if (!cardId || (!pin && !sig)) {
      return NextResponse.json(
        createErrorResponse("VALID_001_GENERAL", {
          cardId: !cardId ? "Card ID is required" : "",
          pin: !pin && !sig ? "PIN or Signature is required" : "",
        }),
        { status: 400 },
      );
    }

    // Apply Rate Limiting
    const rateLimitResult = await cardLoginRateLimiter.check(cardId);
    if (!rateLimitResult.success) {
      console.warn(`[auth] Rate limit exceeded for cardId ${cardId}`);
      return NextResponse.json(
        createErrorResponse(
          "SYSTEM_001_RATE_LIMITED",
          "Too many attempts. Please try again later.",
        ),
        { status: 429 },
      );
    }

    // Use the admin client to look up the card (bypasses RLS)
    const { createClient: createAdminClientImport } =
      await import("@supabase/supabase-js");
    const adminClient = createAdminClientImport(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Look up the card
    const { data: card, error: cardError } = await adminClient
      .from("auth_cards")
      .select("*, profiles(*, roles(name))")
      .eq("card_id", cardId)
      .eq("status", "active")
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        createErrorResponse(
          "AUTH_001_INVALID_CARD",
          "Card ID is invalid or card is inactive",
        ),
        { status: 401 },
      );
    }

    // Verify HMAC signature (Option 2) or raw PIN (legacy fallback)
    let isAuthValid = false;
    if (sig) {
      isAuthValid = verifyCardSignature(cardId, card.pin, sig);
    } else if (pin) {
      isAuthValid =
        card.pin.startsWith("$2a$") || card.pin.startsWith("$2b$")
          ? await bcrypt.compare(pin, card.pin)
          : card.pin === pin;
    }

    if (!isAuthValid) {
      // Log failed attempt (rate limiting already applied above)
      console.warn(`[auth] Failed card login attempt for card ${cardId}`);

      return NextResponse.json(
        createErrorResponse(
          "AUTH_001_INVALID_PIN",
          "Invalid card signature or PIN",
        ),
        { status: 401 },
      );
    }

    // Verify card belongs to user and is still valid
    if (!card.user_id) {
      return NextResponse.json(
        createErrorResponse(
          "AUTH_001_INVALID_CARD",
          "Card is not properly configured",
        ),
        { status: 400 },
      );
    }

    // Get the user's email to sign them in
    const { data: authUser, error: authError } =
      await adminClient.auth.admin.getUserById(card.user_id);

    if (authError || !authUser?.user?.email) {
      return NextResponse.json(
        createErrorResponse("DB_001_USER_NOT_FOUND", "User account not found"),
        { status: 404 },
      );
    }

    // Sign in using the regular supabase client with a generated password token
    // We use admin to generate a magic link sign-in
    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: authUser.user.email,
      });

    if (linkError || !linkData) {
      return NextResponse.json(
        createErrorResponse(
          "SYSTEM_001_INTERNAL_ERROR",
          "Failed to generate authentication token",
        ),
        { status: 500 },
      );
    }

    // Use the regular client to verify the token
    const supabase = await createClient();
    const tokenHash = linkData.properties?.hashed_token;

    if (!tokenHash) {
      return NextResponse.json(
        createErrorResponse(
          "SYSTEM_001_INTERNAL_ERROR",
          "Failed to generate valid authentication token",
        ),
        { status: 500 },
      );
    }

    const { data: verifyData, error: verifyError } =
      await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "magiclink",
      });

    if (verifyError || !verifyData?.user) {
      return handleApiError(verifyError);
    }

    const profile = card.profiles as { roles?: unknown } | null | undefined;
    const userRole =
      normalizeRole(profile?.roles as Parameters<typeof normalizeRole>[0])
        ?.name ?? "learner";

    return NextResponse.json(
      createSuccessResponse({
        role: userRole,
      }),
    );
  } catch (err) {
    return handleApiError(err);
  }
}
