/**
 * ==========================================================================
 * CARD LOGIN API - POST /api/auth/card-login
 * ==========================================================================
 *
 * PURPOSE: Authenticates users via Card ID + PIN instead of email/password.
 * This is ScholarMe's alternative auth method for environments where email
 * access isn't practical (school labs, kiosks, etc.).
 *
 * FLOW:
 * 1. Receive { cardId, pin } from the login form's "Card" tab
 * 2. Use ADMIN client to look up the card in auth_cards table (bypasses RLS)
 * 3. Verify the PIN matches
 * 4. Look up the user's email from Supabase Auth
 * 5. Generate a magic link for that email (admin API)
 * 6. Verify the magic link token to create a real auth session
 * 7. Return success with the user's role
 *
 * WHY ADMIN CLIENT: Cards are looked up by card_id, not by user session.
 * The normal client would be blocked by RLS since the user isn't logged in yet.
 *
 * SECURITY NOTE: PINs are stored as plaintext in this MVP. In production,
 * hash them with bcrypt and compare using bcrypt.compare().
 * ==========================================================================
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { cardId, pin } = await request.json();

    if (!cardId || !pin) {
      return NextResponse.json(
        { error: "Card ID and PIN are required" },
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
        { error: "Invalid card ID or card is inactive" },
        { status: 401 }
      );
    }

    // Compare PIN (stored as plain text for simplicity in this MVP; in production use bcrypt)
    if (card.pin !== pin) {
      return NextResponse.json(
        { error: "Incorrect PIN" },
        { status: 401 }
      );
    }

    // Get the user's email to sign them in
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(card.user_id);

    if (authError || !authUser?.user?.email) {
      return NextResponse.json(
        { error: "User account not found" },
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
        { error: "Failed to authenticate" },
        { status: 500 }
      );
    }

    // Use the regular client to verify the token
    const supabase = await createClient();
    const tokenHash = linkData.properties?.hashed_token;

    if (tokenHash) {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "magiclink",
      });

      if (verifyError) {
        return NextResponse.json(
          { error: "Failed to complete authentication" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      role: card.profiles?.roles?.name || "learner",
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
