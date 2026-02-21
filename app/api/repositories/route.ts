/**
 * ==========================================================================
 * API: REPOSITORIES - GET & POST /api/repositories
 * ==========================================================================
 *
 * GET /api/repositories
 *   Returns all repositories with owner name and resource count.
 *   Used by the Resources page to display the repo list.
 *
 * POST /api/repositories
 *   Creates a new repository. Requires authenticated user.
 *   Body: { title, description?, access_role: "all" | "tutor" | "admin" }
 *   Returns: The created repository record
 *
 * NOTE: GET does not filter by access_role -- all repos are returned.
 *   The Resources page filters client-side based on the user's role.
 *   For production, add RLS policies to enforce server-side filtering.
 * ==========================================================================
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Fetch all repositories with owner name and resource count */
export async function GET() {
  const supabase = await createClient();
  const { data: repos, error } = await supabase
    .from("repositories")
    .select("*, profiles(full_name), resources(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(repos);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, access_role } = await request.json();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("repositories")
    .insert({
      owner_id: user.id,
      title,
      description: description || null,
      access_role: access_role || "all",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
