/** POST /api/admin/create-admin — creates a new administrator account. Only callable by administrators. */
import { createClient, createAdminClient } from "@/lib/supabase/create-client";
import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-errors";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse("AUTH_002_TOKEN_EXPIRED", "Authentication required"),
        { status: 401 }
      );
    }

    // Verify the caller is an administrator
    const { data: callerProfile, error: callerError } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();

    const callerRoles = callerProfile?.roles as any;
    const isCallerAdmin = Array.isArray(callerRoles)
      ? callerRoles.some((r) => r.name === "administrator")
      : callerRoles?.name === "administrator";

    if (callerError || !isCallerAdmin) {
      return NextResponse.json(
        createErrorResponse("AUTH_003_ADMIN_ONLY", "Only administrators can create admin accounts"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, full_name } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        createErrorResponse("VALID_001_GENERAL", "Email, password, and full name are required"),
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        createErrorResponse("VALID_001_PASSWORD_WEAK", "Password must be at least 8 characters"),
        { status: 400 }
      );
    }

    const adminClient = await createAdminClient();

    // Fetch the administrator role id
    const { data: roleRow, error: roleError } = await adminClient
      .from("roles")
      .select("id")
      .eq("name", "administrator")
      .single();

    if (roleError || !roleRow) {
      return NextResponse.json(
        createErrorResponse("DB_001_NOT_FOUND", "Could not resolve administrator role"),
        { status: 500 }
      );
    }

    // Check email not already in use
    const { data: existing } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        createErrorResponse("VALID_001_EMAIL_EXISTS", "An account with this email already exists"),
        { status: 409 }
      );
    }

    // Create auth user
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role_id: roleRow.id,
        role_name: "administrator",
      },
    });

    if (createError || !created?.user) {
      return NextResponse.json(
        createErrorResponse("SYSTEM_001_INTERNAL_ERROR", createError?.message || "Failed to create user"),
        { status: 500 }
      );
    }

    // Create profile with administrator role
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: created.user.id,
        full_name,
        email,
        role_id: roleRow.id,
        terms_accepted_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (profileError) {
      // Rollback: delete the auth user
      await adminClient.auth.admin.deleteUser(created.user.id);
      return NextResponse.json(
        createErrorResponse("DB_001_DATA_INTEGRITY_ERROR", "Failed to create profile"),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ message: "Administrator account created successfully", userId: created.user.id }),
      { status: 201 }
    );
  } catch (err) {
    console.error("[v0] create-admin error:", err);
    return NextResponse.json(
      createErrorResponse("SYSTEM_001_UNKNOWN_ERROR", "An unexpected error occurred"),
      { status: 500 }
    );
  }
}
