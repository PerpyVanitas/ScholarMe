import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { NextResponse } from "next/server";
import { birthdateFields } from "@/lib/profiles/db";
import { getRoleName } from "@/lib/utils/roles";

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

    const body = await request.json();
    const firstName = body.firstName;
    const lastName = body.lastName;
    const fullName = body.fullName;
    const phoneNumber = body.phoneNumber || body.phone;
    const birthdate = body.birthdate;
    const bio = body.bio;
    const degreeProgram = body.degreeProgram;
    const yearLevel = body.yearLevel;
    const hourlyRate = body.hourlyRate;
    const yearsExperience = body.yearsExperience;

    let derivedFirstName = firstName || "";
    let derivedLastName = lastName || "";
    if (fullName && !derivedFirstName && !derivedLastName) {
      const parts = fullName.trim().split(/\s+/);
      derivedFirstName = parts[0] || "";
      derivedLastName = parts.slice(1).join(" ") || "";
    }

    if (!derivedFirstName) {
      return NextResponse.json(
        { success: false, message: "First name is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      first_name: derivedFirstName,
      last_name: derivedLastName || null,
      full_name: fullName || `${derivedFirstName} ${derivedLastName}`.trim(),
      phone_number: phoneNumber || null,
      ...birthdateFields(birthdate || null),
      bio: bio || null,
      degree_program: degreeProgram || null,
      year_level: yearLevel !== undefined && yearLevel !== null ? Number(yearLevel) : null,
      profile_completed: true,
    };

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", data.user.id)
      .select("*, roles(name)")
      .single();

    if (updateError) {
      console.error("[Android Auth] Profile update error:", updateError);
      return NextResponse.json(
        { success: false, message: "Failed to update profile" },
        { status: 500 }
      );
    }

    const roleName = getRoleName(profile);

    // Update tutor details if the user is a tutor
    if (roleName === "tutor") {
      const tutorUpdateData: any = {};
      if (bio !== undefined) tutorUpdateData.bio = bio || null;
      if (hourlyRate !== undefined && hourlyRate !== null) {
        tutorUpdateData.hourly_rate = Number(hourlyRate);
      }
      if (yearsExperience !== undefined && yearsExperience !== null) {
        tutorUpdateData.years_experience = Number(yearsExperience);
      }

      if (Object.keys(tutorUpdateData).length > 0) {
        const { error: tutorError } = await supabase
          .from("tutors")
          .update(tutorUpdateData)
          .eq("user_id", data.user.id);
        if (tutorError) {
          console.error("[Android Auth] Tutor details update error:", tutorError);
        }
      }
    }

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
        avatarUrl: formatAvatarUrl(profile.avatar_url),
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
