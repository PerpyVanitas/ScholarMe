import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * GET /api/quizzes/my-sets
 * Returns all study sets owned by the current user with item counts.
 * Schema: study_sets.owner_id, visibility ('private'|'shared'), generation_mode
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("study_sets")
      .select(`
        id, title, description, generation_mode, visibility, difficulty, created_at,
        study_set_items(count)
      `)
      .eq("owner_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map to shape expected by the quizzes page
    const sets = (data ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      type: s.generation_mode,
      is_public: s.visibility === "shared",
      created_at: s.created_at,
      study_set_items: s.study_set_items,
    }))

    return NextResponse.json({ data: sets })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
