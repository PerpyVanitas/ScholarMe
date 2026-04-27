/** POST /api/auth/card-login -- authenticate via Card ID + PIN (uses admin client to bypass RLS). */
import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    const { cardId, pin } = await request.json();

    if (!cardId || !pin) {
      return NextResponse.json(
        createErrorResponse("VALID_001_GENERAL", {
          cardId: !cardId ? "Card ID is required" : "",
          pin: !pin ? "PIN is required" : "",
        }),
        { status: 400 }
      );
    }

    // Use the admin client to look up the card (bypasses RLS)
    const { createClient: createAdminClientImport } = await import("@supabase/supabase-js");
    const adminClient = createAdminClientImport(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up the card
    const { data: card, error: cardError } = await adminClient
      .from("auth_cards")
      .select("*, profiles(*, roles(*))")
      .eq("card_id", cardId)
      .eq("status", "active")
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        createErrorResponse("AUTH_001_INVALID_CARD", "Card ID is invalid or card is inactive"),
        { status: 401 }
      );
    }

    // Compare PIN (simple string comparison; in production should use bcrypt)
    // Also implement brute force protection
    if (card.pin !== pin) {
      // Log failed attempt (could be used to implement rate limiting)
      console.warn(`[auth] Failed PIN attempt for card ${cardId}`);
      
      return NextResponse.json(
        createErrorResponse("AUTH_001_INVALID_PIN", "Incorrect PIN"),
        { status: 401 }
      );
    }

    // Verify card belongs to user and is still valid
    if (!card.user_id) {
      return NextResponse.json(
        createErrorResponse("AUTH_001_INVALID_CARD", "Card is not properly configured"),
        { status: 400 }
      );
    }

    // Get the user's email to sign them in
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(card.user_id);

    if (authError || !authUser?.user?.email) {
      return NextResponse.json(
        createErrorResponse("DB_001_USER_NOT_FOUND", "User account not found"),
        { status: 404 }
      );
    }

    // Sign in using the regular supabase client with a generated password token
    // We use admin to generate a magic link sign-in
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: authUser.user.email,
    });

    if (linkError || !linkData) {
      return NextResponse.json(
        createErrorResponse("SYSTEM_001_INTERNAL_ERROR", "Failed to generate authentication token"),
        { status: 500 }
      );
    }

    // Use the regular client to verify the token
    const supabase = await createClient();
    const tokenHash = linkData.properties?.hashed_token;

    if (!tokenHash) {
      return NextResponse.json(
        createErrorResponse("SYSTEM_001_INTERNAL_ERROR", "Failed to generate valid authentication token"),
        { status: 500 }
      );
    }

    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });

    if (verifyError || !verifyData?.user) {
      console.error("[auth] Token verification failed:", verifyError);
      return NextResponse.json(
        createErrorResponse("SYSTEM_001_INTERNAL_ERROR", "Failed to complete authentication"),
        { status: 500 }
      );
    }

    const userRole = Array.isArray(card.profiles?.roles) && card.profiles.roles.length > 0 
      ? card.profiles.roles[0].name 
      : "learner";
    
    return NextResponse.json(
      createSuccessResponse({
        role: userRole,
      })
    );
  } catch {
    return NextResponse.json(
      createErrorResponse("SYSTEM_001_UNKNOWN_ERROR", "An unexpected error occurred"),
      { status: 500 }
    );
  }
}
