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
