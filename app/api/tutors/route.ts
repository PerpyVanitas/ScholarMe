import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const specialization = searchParams.get("specialization") || "";

  let query = supabase
    .from("tutors")
    .select("*, profiles(*), tutor_specializations(specializations(*))")
    .order("rating", { ascending: false });

  const { data: tutors, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let filtered = tutors || [];

  if (search) {
    const lower = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.profiles?.full_name?.toLowerCase().includes(lower) ||
        t.bio?.toLowerCase().includes(lower)
    );
  }

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
