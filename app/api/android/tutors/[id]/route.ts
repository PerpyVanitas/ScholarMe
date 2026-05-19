import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

/** GET /api/android/tutors/[id] — single tutor with availability */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: tutor, error } = await supabase
      .from("tutors")
      .select(
        `id, user_id, bio, rating, total_ratings, hourly_rate, years_experience, is_available,
         profiles!user_id(id, full_name, first_name, last_name, email, avatar_url),
         tutor_specializations(specializations(id, name, description)),
         tutor_availability(id, day_of_week, start_time, end_time, is_available)`
      )
      .eq("id", id)
      .single();

    if (error || !tutor) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Tutor not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: tutor.id,
        userId: tutor.user_id,
        fullName: (tutor as any).profiles?.full_name ?? "",
        email: (tutor as any).profiles?.email ?? "",
        avatarUrl: (tutor as any).profiles?.avatar_url ?? null,
        bio: tutor.bio ?? null,
        rating: tutor.rating ?? 0,
        totalRatings: tutor.total_ratings ?? 0,
        hourlyRate: tutor.hourly_rate ?? null,
        experienceYears: tutor.years_experience ?? null,
        isAvailable: tutor.is_available ?? true,
        specializations: ((tutor as any).tutor_specializations ?? []).map((ts: any) => ({
          id: ts.specializations?.id,
          name: ts.specializations?.name,
          description: ts.specializations?.description,
        })),
        availability: ((tutor as any).tutor_availability ?? []).map((a: any) => ({
          id: a.id,
          dayOfWeek: a.day_of_week,
          startTime: a.start_time,
          endTime: a.end_time,
          isAvailable: a.is_available,
        })),
      },
    });
  } catch (error) {
    console.error("[Android Tutors] GET [id] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch tutor" } },
      { status: 500 }
    );
  }
}
