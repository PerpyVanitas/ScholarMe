import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

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

    if (profileError) {
        console.error("Profile fetch error:", profileError);
    }

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        token: data.session?.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: profile?.full_name || "",
          role: (profile?.roles as any)?.name || "learner",
          avatarUrl: profile?.avatar_url || null,
          phoneNumber: profile?.phone_number || null,
          isProfileComplete: !!profile?.full_name
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
