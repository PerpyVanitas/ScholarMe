import { createClient } from "@/lib/supabase/create-client";
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
    const supabase = await createClient();

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
      profile_completed: true,
    };

    // Add bio if user is a tutor
    if (bio) {
      updateData.bio = bio;
    }

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", data.user.id)
      .select()
      .single();

    if (updateError) {
      console.error("[Android Auth] Profile update error:", updateError);
      return NextResponse.json(
        { success: false, message: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        firstName: profile.first_name,
        lastName: profile.last_name,
        fullName: profile.full_name,
        phoneNumber: profile.phone_number,
        birthdate: profile.birthdate,
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
