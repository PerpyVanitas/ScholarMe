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

    // Create profile
    const adminClient = createBareAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: data.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        phone_number: phoneNumber,
        role_id: accountType === "tutor" ? "tutor" : "learner",
        profile_completed: false,
      });

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
