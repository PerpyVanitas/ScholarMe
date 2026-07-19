import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ensureProfileRow } from "@/features/profiles/api/db";

export type TutorRow = {
  id: string;
  user_id: string;
  bio: string | null;
  rating: number | null;
  total_ratings: number | null;
  hourly_rate: number | null;
  years_experience: number | null;
  is_available: boolean | null;
  created_at?: string;
};

/** Ensure profiles + tutors rows exist for a tutor account. */
export async function ensureTutorRow(
  supabase: SupabaseClient,
  user: User,
): Promise<{ ok: true; tutor: TutorRow } | { ok: false; error: string }> {
  const profileResult = await ensureProfileRow(supabase, user);
  if (!profileResult.ok) {
    return { ok: false, error: profileResult.error };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("tutors")
    .select(
      "id, user_id, bio, rating, total_ratings, hourly_rate, years_experience, is_available",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (existing) {
    return { ok: true, tutor: existing as TutorRow };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("tutors")
    .insert({
      user_id: user.id,
      rating: 0,
      total_ratings: 0,
      is_available: true,
    })
    .select(
      "id, user_id, bio, rating, total_ratings, hourly_rate, years_experience, is_available",
    )
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: retry, error: retryError } = await supabase
        .from("tutors")
        .select(
          "id, user_id, bio, rating, total_ratings, hourly_rate, years_experience, is_available",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (!retryError && retry) {
        return { ok: true, tutor: retry as TutorRow };
      }
    }
    return { ok: false, error: insertError.message };
  }

  return { ok: true, tutor: inserted as TutorRow };
}

export type TutorSearchParams = {
  page?: number;
  limit?: number;
  searchQuery?: string;
  specialization?: string;
};

export async function fetchTutors(
  supabase: SupabaseClient,
  params: TutorSearchParams,
) {
  const { page = 1, limit = 12, searchQuery = "", specialization = "all" } = params;
  const offset = (page - 1) * limit;

  // Since we need to filter by roles and attendance on the client historically,
  // to do it on the server requires complex joins. For this iteration, we use
  // PostgREST syntax to filter out non-tutors and only those with active attendance logs.
  
  let selectString = "*, profiles!inner(*, roles!inner(name)), attendance_logs!inner(clock_in, clock_out)";
  
  if (specialization !== "all") {
    selectString += ", tutor_specializations!inner(specializations!inner(*))";
  } else {
    selectString += ", tutor_specializations(specializations(*))";
  }

  let query = supabase
    .from("tutors")
    .select(selectString, { count: "exact" })
    .in("profiles.roles.name", ["tutor", "officer", "super_admin"])
    .is("attendance_logs.clock_out", null)
    .order("rating", { ascending: false });

  if (searchQuery) {
    query = query.ilike("profiles.full_name", `%${searchQuery}%`);
  }

  if (specialization !== "all") {
    query = query.eq("tutor_specializations.specializations.name", specialization);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching tutors:", error);
    return { data: [], count: 0, error };
  }

  return { data, count: count || 0, error: null };
}
