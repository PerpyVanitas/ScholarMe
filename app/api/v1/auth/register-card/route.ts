/** POST /api/auth/register-card -- Admin endpoint to create and register new auth cards */
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-errors";
import { isAdminRole } from "@/lib/utils/roles";
import bcrypt from "bcryptjs";

const registerCardSchema = z.object({
  card_id: z.string({
    required_error: "Card ID is required",
    invalid_type_error: "Card ID must be a string",
  }),
  pin: z
    .string({
      required_error: "PIN is required",
      invalid_type_error: "PIN must be a string",
    })
    .min(4, "PIN must be at least 4 digits"),
  assigned_to_user_id: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { card_id, pin, assigned_to_user_id } = parsed.data;

    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse("AUTH_002_SESSION_EXPIRED", "Session expired"),
        { status: 401 },
      );
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();

    const roleName = Array.isArray(profile?.roles)
      ? profile.roles[0]?.name
      : ((profile?.roles as unknown as Record<string, unknown> | null)?.name as
          string | undefined);
    const isAdmin = isAdminRole(roleName as string);

    if (profileError || !profile || !isAdmin) {
      return NextResponse.json(
        createErrorResponse("AUTH_003_ADMIN_ONLY", "Admin access required"),
        { status: 403 },
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
        createErrorResponse(
          "DB_001_DUPLICATE_RECORD",
          "Card ID already exists",
        ),
        { status: 409 },
      );
    }

    // Hash the PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    // Create new card
    const { data: newCard, error: createError } = await supabase
      .from("auth_cards")
      .insert({
        card_id,
        pin: hashedPin,
        assigned_to: assigned_to_user_id || null,
        status: "active",
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        createErrorResponse(
          "DB_001_DATA_INTEGRITY_ERROR",
          "Failed to create card",
        ),
        { status: 500 },
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        message: "Card registered successfully",
        card: newCard,
      }),
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      createErrorResponse(
        "SYSTEM_001_UNKNOWN_ERROR",
        "An unexpected error occurred",
      ),
      { status: 500 },
    );
  }
}
