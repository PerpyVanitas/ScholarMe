import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

/** GET /api/android/auth/profile — fetch own profile using Bearer token */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid authorization token" } },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } },
        { status: 401 }
      );
    }

    // Fetch profile with role via FK join
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, roles:roles!role_id(id, name)")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Profile not found" } },
        { status: 404 }
      );
    }

    const roleName: string = Array.isArray(profile.roles)
      ? (profile.roles[0]?.name ?? "learner")
      : ((profile.roles as { name?: string } | null)?.name ?? "learner");

    // Fetch tutor stats only when role is actually "tutor"
    let tutorStats = null;
    if (roleName === "tutor") {
      const { data: tutor } = await supabase
        .from("tutors")
        .select("rating, total_ratings, years_experience, hourly_rate")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (tutor) {
        tutorStats = {
          rating: tutor.rating,
          totalRatings: tutor.total_ratings,
          yearsExperience: tutor.years_experience,
          hourlyRate: tutor.hourly_rate,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: profile.id,
        firstName: profile.first_name ?? "",
        lastName: profile.last_name ?? "",
        fullName: profile.full_name ?? "",
        email: profile.email ?? "",
        phoneNumber: profile.phone_number ?? null,
        birthdate: profile.birthdate ?? null,
        avatarUrl: profile.avatar_url ?? null,
        role: roleName,
        profileCompleted: profile.profile_completed ?? false,
        createdAt: profile.created_at,
        tutorStats,
      },
    });
  } catch (error) {
    console.error("[Android Auth] Get profile error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
