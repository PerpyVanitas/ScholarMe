import { createAdminClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password, phoneNumber, accountType } = await request.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "All required fields must be provided" } },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters" } },
        { status: 400 }
      );
    }

    const adminClient = await createAdminClient();

    // Look up the role UUID from the roles table
    const roleName = accountType === "tutor" ? "tutor" : "learner";
    const { data: roleRow } = await adminClient
      .from("roles")
      .select("id")
      .eq("name", roleName)
      .single();

    if (!roleRow?.id) {
      return NextResponse.json(
        { success: false, error: { code: "ROLE_NOT_FOUND", message: `Role '${roleName}' not found in database` } },
        { status: 500 }
      );
    }

    // Check phone uniqueness if provided
    if (phoneNumber) {
      const { data: existing } = await adminClient
        .from("profiles")
        .select("id")
        .eq("phone_number", phoneNumber)
        .maybeSingle();
      if (existing) {
        return NextResponse.json(
          { success: false, error: { code: "PHONE_TAKEN", message: "This phone number is already registered" } },
          { status: 409 }
        );
      }
    }

    // Create user with email confirmed (no email verification required for Android)
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role_id: roleRow.id,
        role_name: roleName,
      },
    });

    if (createError || !created?.user) {
      return NextResponse.json(
        { success: false, error: { code: "CREATE_ERROR", message: createError?.message ?? "Failed to create user" } },
        { status: 400 }
      );
    }

    // Upsert profile row with correct role_id UUID
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: created.user.id,
        email,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        phone_number: phoneNumber ?? null,
        role_id: roleRow.id,
        profile_completed: false,
      }, { onConflict: "id" });

    if (profileError) {
      console.error("[Android Auth] Profile upsert error:", profileError);
      // Non-fatal — trigger handle_new_user may have already created the row
    }

    // Sign in to get a token
    const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({ email, password });
    if (signInError || !signInData.session) {
      // Registration succeeded even if auto-login fails
      return NextResponse.json({
        success: true,
        data: {
          userId: created.user.id,
          email: created.user.email ?? "",
          token: null,
          refreshToken: null,
          user: {
            id: created.user.id,
            email: created.user.email ?? "",
            fullName: `${firstName.trim()} ${lastName.trim()}`,
            role: roleName,
            avatarUrl: null,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: created.user.id,
        email: created.user.email ?? "",
        token: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token,
        user: {
          id: created.user.id,
          email: created.user.email ?? "",
          fullName: `${firstName.trim()} ${lastName.trim()}`,
          role: roleName,
          avatarUrl: null,
        },
      },
    });
  } catch (error) {
    console.error("[Android Auth] Registration error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
