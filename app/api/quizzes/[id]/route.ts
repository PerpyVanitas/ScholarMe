import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/quizzes/[id]
 * Fetch a single study set with all items (for the study session page).
 * Accessible if owner or visibility = 'shared'.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("study_sets")
      .select(`
        *,
        study_set_items(*),
        profiles:owner_id(full_name, avatar_url)
      `)
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json({ error: "Study set not found" }, { status: 404 })
    }

    // Access control: owner or public
    if (data.visibility !== "shared" && data.owner_id !== user?.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/quizzes/[id]
 * Deletes the study set — owner only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { error } = await supabase
      .from("study_sets")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id)   // RLS enforces this too, belt-and-suspenders

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
