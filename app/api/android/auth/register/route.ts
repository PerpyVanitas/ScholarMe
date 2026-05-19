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
      fullName,
      role
    } = await request.json();

    // Validate input (support both web and android formats)
    const isWebFormat = firstName && lastName;
    const isAndroidFormat = fullName;

    if (!(isWebFormat || isAndroidFormat) || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign up with email/password
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
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

    const adminClient = createBareAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const requestedRole = (accountType || role || "learner").toLowerCase();
    const safeRole = requestedRole === "tutor" ? "tutor" : "learner";

    // Resolve role ID from a public-registration allowlist.
    const { data: roleData } = await adminClient
      .from("roles")
      .select("id")
      .eq("name", safeRole)
      .single();

    const roleId = roleData?.id;

    if (!roleId) {
      return NextResponse.json(
        { success: false, message: "Invalid role specified" },
        { status: 400 }
      );
    }

    let derivedFirstName = firstName || "";
    let derivedLastName = lastName || "";
    if (fullName && !derivedFirstName && !derivedLastName) {
      const parts = fullName.trim().split(/\s+/);
      derivedFirstName = parts[0] || "";
      derivedLastName = parts.slice(1).join(" ") || "";
    }

    // Create/update profile (upsert to avoid conflict with handle_new_user trigger)
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: data.user.id,
        email,
        full_name: fullName || `${firstName} ${lastName}`,
        first_name: derivedFirstName || null,
        last_name: derivedLastName || null,
        phone_number: phoneNumber || "",
        role_id: roleId,
        profile_completed: false,
      }, { onConflict: "id" });

    if (profileError) {
      console.error("[Android Auth] Profile creation error:", profileError);
      return NextResponse.json(
        { success: false, message: "Failed to create profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      data: {
        token: data.session?.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: fullName || `${firstName} ${lastName}`,
          role: safeRole,
          isProfileComplete: false
        },
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
