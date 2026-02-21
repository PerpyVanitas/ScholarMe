/**
 * ==========================================================================
 * API: LIST TUTORS - GET /api/tutors
 * ==========================================================================
 *
 * PURPOSE: Returns all tutors with their profiles and specializations.
 * Used by the Tutors browse page (/dashboard/tutors).
 *
 * QUERY PARAMS (optional):
 * - search: Filter by tutor name or bio text (case-insensitive)
 * - specialization: Filter by specialization name (exact match)
 *
 * RESPONSE: Array of tutor objects, each including:
 * - profiles: { full_name, email, avatar_url }
 * - tutor_specializations: [{ specializations: { name } }]
 *
 * Sorted by rating (highest first) so top-rated tutors appear first.
 *
 * NOTE: Filtering is done server-side in JavaScript (not SQL) because
 * Supabase doesn't support .ilike() on joined tables easily. For large
 * datasets, consider using Supabase full-text search or PostgreSQL functions.
 * ==========================================================================
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const specialization = searchParams.get("specialization") || "";

  // Fetch all tutors with their profile info and specializations (nested JOIN)
  // tutors -> profiles (user info)
  // tutors -> tutor_specializations -> specializations (subjects they teach)
  const query = supabase
    .from("tutors")
    .select("*, profiles(*), tutor_specializations(specializations(*))")
    .order("rating", { ascending: false });

  const { data: tutors, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let filtered = tutors || [];

  // Client-side search filter: match against tutor name or bio
  if (search) {
    const lower = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.profiles?.full_name?.toLowerCase().includes(lower) ||
        t.bio?.toLowerCase().includes(lower)
    );
  }

  // Client-side specialization filter: check if tutor teaches this subject
  if (specialization) {
    filtered = filtered.filter((t) =>
      t.tutor_specializations?.some(
        (ts: { specializations: { name: string } }) =>
          ts.specializations?.name === specialization
      )
    );
  }

  return NextResponse.json(filtered);
}
