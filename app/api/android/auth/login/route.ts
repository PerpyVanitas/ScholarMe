import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Email and password are required" } },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: "LOGIN_ERROR", message: error.message || "Login failed" } },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: { code: "NO_USER", message: "No user data returned" } },
        { status: 401 }
      );
    }

    // Fetch profile with role via FK join
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, roles:roles!role_id(id, name)")
      .eq("id", data.user.id)
      .single();

    const roleName: string = Array.isArray(profile?.roles)
      ? (profile.roles[0]?.name ?? "learner")
      : ((profile?.roles as { name?: string } | null)?.name ?? "learner");

    return NextResponse.json({
      success: true,
      data: {
        token: data.session?.access_token ?? "",
        refreshToken: data.session?.refresh_token ?? "",
        user: {
          id: data.user.id,
          email: data.user.email ?? "",
          fullName: profile?.full_name ?? "",
          role: roleName,
          avatarUrl: profile?.avatar_url ?? null,
          phoneNumber: profile?.phone_number ?? null,
          birthdate: profile?.birthdate ?? null,
        },
      },
    });
  } catch (error) {
    console.error("[Android Auth] Login error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
