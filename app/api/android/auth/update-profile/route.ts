import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid authorization token" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createSupabaseForBearer(token);

    // Verify token and get user
    const { data, error: authError } = await supabase.auth.getUser(token);

    if (authError || !data.user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { firstName, lastName, phoneNumber, birthdate, bio } = await request.json();

    // Validate input
    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: "First name and last name are required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      phone_number: phoneNumber || null,
      birthdate: birthdate || null,
      date_of_birth: birthdate || null,
      bio: bio || null,
      profile_completed: true,
    };

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", data.user.id)
      .select("*, roles:roles!role_id(name)")
      .single();

    if (updateError) {
      console.error("[Android Auth] Profile update error:", updateError);
      return NextResponse.json(
        { success: false, message: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Update bio in tutors table if provided
    if (bio) {
      const { error: tutorError } = await supabase
        .from("tutors")
        .update({ bio })
        .eq("user_id", data.user.id);
      if (tutorError) {
        console.error("[Android Auth] Tutor bio update error:", tutorError);
      }
    }

    const roleName: string = Array.isArray(profile?.roles)
      ? (profile.roles[0]?.name ?? "learner")
      : ((profile?.roles as any)?.name ?? "learner");

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

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: profile.id,
        userId: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone_number,
        phoneNumber: profile.phone_number,
        birthdate: profile.birthdate || profile.date_of_birth || null,
        avatarUrl: profile.avatar_url,
        accountType: roleName,
        role: roleName,
        profileCompleted: profile.profile_completed,
        isProfileComplete: profile.profile_completed,
        bio: profile.bio || null,
        totalXp: profile.total_xp || 0,
        currentLevel: profile.current_level || 1,
        tutorStats: tutorStats,
        createdAt: profile.created_at
      },
    });
  } catch (error) {
    console.error("[Android Auth] Update profile error:", error);
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
