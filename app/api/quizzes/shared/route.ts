import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * GET /api/quizzes/shared
 * Returns public study sets from other users.
 * Schema: visibility = 'shared', owner_id (join to profiles)
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("study_sets")
      .select(`
        id, title, description, generation_mode, visibility, difficulty, created_at,
        study_set_items(count),
        profiles:owner_id(full_name, avatar_url)
      `)
      .eq("visibility", "shared")
      .eq("is_archived", false)
      .neq("owner_id", user?.id ?? "00000000-0000-0000-0000-000000000000")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const sets = (data ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      type: s.generation_mode,
      is_public: true,
      created_at: s.created_at,
      study_set_items: s.study_set_items,
      profiles: s.profiles,
    }))

    return NextResponse.json({ data: sets })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
