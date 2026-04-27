/** GET /api/tutors -- list all tutors with profiles and specializations (highest-rated first). */
import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const specialization = searchParams.get("specialization") || "";

  // Build query with server-side filtering for scalability
  let query = supabase
    .from("tutors")
    .select("*, profiles(*), tutor_specializations(specializations(*))")
    .order("rating", { ascending: false });

  // Server-side search filter: match against tutor name in the profiles join
  if (search) {
    query = query.ilike("profiles.full_name", `%${search}%`);
  }

  const { data: tutors, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let filtered = (tutors || []).filter(Boolean);

  // Post-filter for search on bio (not easily done via join ilike)
  if (search) {
    const lower = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.profiles?.full_name?.toLowerCase().includes(lower) ||
        t.bio?.toLowerCase().includes(lower)
    );
  }

  // Server-side specialization filter using the already-joined data
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
