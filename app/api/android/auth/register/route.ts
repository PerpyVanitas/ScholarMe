import { createClient } from "@/lib/supabase/create-client";
import { createClient as createBareAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      accountType,
    } = await request.json();

    // Validate input
    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // SECURITY: Allowlist roles to prevent privilege escalation
    const selectedRole = accountType === "tutor" ? "tutor" : "learner";

    const supabase = await createClient();
    const adminClient = createBareAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve the actual role UUID from the roles table
    const { data: roleRow, error: roleError } = await adminClient
      .from("roles")
      .select("id")
      .eq("name", selectedRole)
      .single();

    if (roleError || !roleRow) {
      console.error("[Android Auth] Role resolution error:", roleError);
      return NextResponse.json(
        { success: false, message: "Invalid account type" },
        { status: 400 }
      );
    }

    // Sign up with email/password
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role_id: roleRow.id,
          role_name: selectedRole,
        },
      },
    });

    if (signUpError) {
      return NextResponse.json(
        {
          success: false,
          message: signUpError.message || "Registration failed",
          errorCode: "SIGNUP_ERROR",
        },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, message: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create profile with the resolved role UUID
    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: data.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        phone_number: phoneNumber,
        role_id: roleRow.id,
        profile_completed: false,
      });

    if (profileError) {
      console.error("[Android Auth] Profile creation error:", profileError);
      // Rollback auth user to avoid orphaned accounts
      await adminClient.auth.admin.deleteUser(data.user.id).catch(() => {});
      return NextResponse.json(
        { success: false, message: "Failed to create profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      data: {
        userId: data.user.id,
        email: data.user.email,
        requiresVerification: !data.user.confirmed_at,
      },
    });
  } catch (error) {
    console.error("[Android Auth] Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred",
        errorCode: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
