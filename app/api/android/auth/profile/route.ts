import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid authorization token" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Create client with the token
    const supabase = await createClient();

    // Verify token and get user
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Fetch complete profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    // Fetch additional stats if tutor
    let tutorStats = null;
    if (profile.role_id === "tutor") {
      const { data: tutor } = await supabase
        .from("tutors")
        .select("*")
        .eq("user_id", data.user.id)
        .single();

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
        firstName: profile.first_name,
        lastName: profile.last_name,
        fullName: profile.full_name,
        email: profile.email,
        phoneNumber: profile.phone_number,
        birthdate: profile.birthdate,
        avatarUrl: profile.avatar_url,
        accountType: profile.role_id,
        profileCompleted: profile.profile_completed,
        createdAt: profile.created_at,
        tutorStats: tutorStats,
      },
    });
  } catch (error) {
    console.error("[Android Auth] Get profile error:", error);
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
