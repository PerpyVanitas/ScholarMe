import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";
import { getRoleName } from "@/lib/utils/roles";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Login failed",
          errorCode: "LOGIN_ERROR",
        },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, message: "No user data returned" },
        { status: 401 }
      );
    }

    // Fetch user profile with role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, roles(name)")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        {
          success: false,
          message: "Account exists but profile is missing. Please contact support.",
          errorCode: "PROFILE_NOT_FOUND",
        },
        { status: 500 }
      );
    }

    const roleName = getRoleName(profile);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        token: data.session?.access_token,
        userId: data.user.id,
        email: data.user.email,
        user: {
          id: data.user.id,
          userId: data.user.id,
          email: data.user.email,
          fullName: profile.full_name || "",
          firstName: profile.first_name || null,
          lastName: profile.last_name || null,
          role: roleName,
          accountType: roleName,
          avatarUrl: profile?.avatar_url || null,
          phone: profile?.phone_number || null,
          phoneNumber: profile?.phone_number || null,
          birthdate: profile?.birthdate || profile?.date_of_birth || null,
          profileCompleted: !!profile?.profile_completed,
          isProfileComplete: !!profile?.profile_completed
        },
      },
    });

  } catch (error) {
    console.error("[Android Auth] Login error:", error);
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
}
