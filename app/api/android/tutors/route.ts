import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

/** GET /api/android/tutors — paginated tutor list with search and specialization filter */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const search = searchParams.get("search")?.trim() ?? null;
    const specializationId = searchParams.get("specialization") ?? null;

    const supabase = await createClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("tutors")
      .select(
        `id, user_id, bio, rating, total_ratings, hourly_rate, years_experience, is_available, created_at,
         profiles!user_id(id, full_name, first_name, last_name, email, avatar_url),
         tutor_specializations(specializations(id, name, description))`,
        { count: "exact" }
      )
      .eq("is_available", true)
      .range(offset, offset + limit - 1)
      .order("rating", { ascending: false });

    if (search) {
      query = query.ilike("profiles.full_name", `%${search}%`);
    }
    if (specializationId) {
      query = query.eq("tutor_specializations.specialization_id", specializationId);
    }

    const { data: tutors, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        tutors: (tutors ?? []).map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          fullName: t.profiles?.full_name ?? "",
          email: t.profiles?.email ?? "",
          avatarUrl: t.profiles?.avatar_url ?? null,
          bio: t.bio ?? null,
          rating: t.rating ?? 0,
          totalRatings: t.total_ratings ?? 0,
          hourlyRate: t.hourly_rate ?? null,
          experienceYears: t.years_experience ?? null,
          isAvailable: t.is_available ?? true,
          specializations: (t.tutor_specializations ?? []).map((ts: any) => ({
            id: ts.specializations?.id,
            name: ts.specializations?.name,
            description: ts.specializations?.description,
          })),
        })),
        pagination: {
          page,
          limit,
          total: count ?? 0,
          pages: Math.ceil((count ?? 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error("[Android Tutors] GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch tutors" } },
      { status: 500 }
    );
  }
}
