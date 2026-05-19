import { createClient } from "@/lib/supabase/create-client";
import { createClient as createBareAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { resolveRoleId } from "@/lib/profiles/db";

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

    const adminClient = createBareAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const requestedRole = (accountType || role || "learner").toLowerCase();
    const safeRole = requestedRole === "tutor" ? "tutor" : "learner";

    // Check if phone number is already registered
    if (phoneNumber) {
      const { data: existingPhone } = await adminClient
        .from("profiles")
        .select("id")
        .eq("phone_number", phoneNumber)
        .maybeSingle();

      if (existingPhone) {
        return NextResponse.json(
          {
            success: false,
            message: "This phone number is already registered. Please use a different number or sign in to your existing account.",
            errorCode: "PHONE_ALREADY_EXISTS",
          },
          { status: 400 }
        );
      }
    }

    let roleId: string;
    try {
      roleId = await resolveRoleId(adminClient, safeRole);
    } catch {
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

    // Sign up with admin client to bypass email confirmation and set metadata
    const { data: userData, error: signUpError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || `${firstName} ${lastName}`,
        first_name: derivedFirstName || null,
        last_name: derivedLastName || null,
        phone_number: phoneNumber || "",
        role_id: roleId,
        role_name: safeRole,
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

    if (!userData.user) {
      return NextResponse.json(
        { success: false, message: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create/update profile (upsert to avoid conflict with handle_new_user trigger)
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: userData.user.id,
        email,
        full_name: fullName || `${firstName} ${lastName}`,
        first_name: derivedFirstName || null,
        last_name: derivedLastName || null,
        phone_number: phoneNumber || "",
        role_id: roleId,
        profile_completed: false,
        terms_accepted_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (profileError) {
      console.error("[Android Auth] Profile creation error:", profileError);
      return NextResponse.json(
        { success: false, message: "Failed to create profile" },
        { status: 500 }
      );
    }

    // If tutor, automatically create a row in the tutors table
    if (safeRole === "tutor") {
      const { error: tutorError } = await adminClient
        .from("tutors")
        .insert({
          user_id: userData.user.id,
          rating: 0,
          total_ratings: 0,
          is_available: true,
        });

      if (tutorError) {
        console.error("[Android Auth] Failed to create tutor record:", tutorError);
      }
    }

    // Sign in to retrieve a valid session token for the android client
    const supabase = await createClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("[Android Auth] Sign in error after registration:", signInError);
      return NextResponse.json(
        { success: false, message: "Registration succeeded but sign in failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      data: {
        token: signInData.session?.access_token,
        userId: userData.user.id,
        email: userData.user.email,
        user: {
          id: userData.user.id,
          userId: userData.user.id,
          email: userData.user.email,
          fullName: fullName || `${firstName} ${lastName}`,
          firstName: derivedFirstName || null,
          lastName: derivedLastName || null,
          role: safeRole,
          accountType: safeRole,
          phone: phoneNumber || null,
          phoneNumber: phoneNumber || null,
          profileCompleted: false,
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
