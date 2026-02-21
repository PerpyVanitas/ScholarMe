/** GET /api/tutors -- list all tutors with profiles and specializations (highest-rated first). */
import { createClient } from "@/lib/supabase/create-client";
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
