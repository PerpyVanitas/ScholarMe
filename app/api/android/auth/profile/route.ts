import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { NextResponse } from "next/server";
import { getRoleName } from "@/lib/utils/roles";

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
    const supabase = createSupabaseForBearer(token);

    // Verify token and get user
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Fetch complete profile with role name
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, roles(name)")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    const roleName = getRoleName(profile);

    // Fetch additional stats if tutor
    let tutorStats = null;
    if (roleName === "tutor") {
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

    // Helper function to format avatar url
    const formatAvatarUrl = (url: string | null | undefined): string | null => {
      if (!url) return null;
      if (url.startsWith("data:") || url.startsWith("http")) return url;
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
      const proto = request.headers.get("x-forwarded-proto") || "http";
      return `${proto}://${host}/api/avatar?pathname=${encodeURIComponent(url)}`;
    };

    return NextResponse.json({
      success: true,
      data: {
        userId: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        fullName: profile.full_name,
        email: profile.email,
        phoneNumber: profile.phone_number,
        birthdate: profile.birthdate || profile.date_of_birth || null,
        program: profile.program || profile.degree_program || null,
        studentId: profile.student_id || null,
        emergencyContact: profile.emergency_contact || profile.emergency_contact_number || null,
        emergencyContactName: profile.emergency_contact_name || null,
        avatarUrl: formatAvatarUrl(profile.avatar_url),
        accountType: roleName,
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
