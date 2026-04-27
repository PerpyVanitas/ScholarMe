/** POST /api/auth/register-card -- Admin endpoint to create and register new auth cards */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    const { card_id, pin, assigned_to_user_id } = await request.json();

    // Validate input
    if (!card_id || !pin) {
      return NextResponse.json(
        createErrorResponse("VALID_001_GENERAL", {
          card_id: !card_id ? "Card ID is required" : "",
          pin: !pin ? "PIN is required" : "",
        }),
        { status: 400 }
      );
    }

    if (pin.length < 4) {
      return NextResponse.json(
        createErrorResponse("VALID_001_PASSWORD_SHORT", "PIN must be at least 4 digits"),
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse("AUTH_002_SESSION_EXPIRED", "Session expired"),
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();

    const isAdmin = Array.isArray(profile?.roles) && 
      profile.roles.some((role: any) => role.name === "administrator");
    
    if (profileError || !profile || !isAdmin) {
      return NextResponse.json(
        createErrorResponse("AUTH_003_ADMIN_ONLY", "Admin access required"),
        { status: 403 }
      );
    }

    // Check if card already exists
    const { data: existingCard } = await supabase
      .from("auth_cards")
      .select("id")
      .eq("card_id", card_id)
      .single();

    if (existingCard) {
      return NextResponse.json(
        createErrorResponse("DB_001_DUPLICATE_RECORD", "Card ID already exists"),
        { status: 409 }
      );
    }

    // Create new card
    const { data: newCard, error: createError } = await supabase
      .from("auth_cards")
      .insert({
        card_id,
        pin,
        assigned_to: assigned_to_user_id || null,
        status: "active",
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        createErrorResponse("DB_001_DATA_INTEGRITY_ERROR", "Failed to create card"),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        message: "Card registered successfully",
        card: newCard,
      }),
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      createErrorResponse("SYSTEM_001_UNKNOWN_ERROR", "An unexpected error occurred"),
      { status: 500 }
    );
  }
}
