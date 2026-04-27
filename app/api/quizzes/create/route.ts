import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/quizzes/create
 * Creates a study set and its items.
 * Schema: owner_id, generation_mode, visibility ('private'|'shared'), source_type, prompt+answer (not question/answer)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, type, is_public, source_type, items } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "At least one question is required" }, { status: 400 })
    }

    // Create study set
    const { data: studySet, error: setError } = await supabase
      .from("study_sets")
      .insert({
        owner_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        generation_mode: type || "flashcard",
        visibility: is_public ? "shared" : "private",
        source_type: source_type || "upload",
        question_count: items.length,
        difficulty: "medium",
      })
      .select()
      .single()

    if (setError) {
      console.error("[quizzes/create] set error:", setError)
      return NextResponse.json({ error: setError.message }, { status: 500 })
    }

    // Insert items — schema uses prompt/answer not question/answer
    const itemsToInsert = items.map((item: { question: string; answer: string; options?: string[]; item_type?: string }, index: number) => ({
      study_set_id: studySet.id,
      prompt: item.question,
      answer: item.answer,
      options: item.options || null,
      item_type: item.item_type || type || "flashcard",
      order_index: index,
    }))

    const { error: itemsError } = await supabase
      .from("study_set_items")
      .insert(itemsToInsert)

    if (itemsError) {
      // Rollback the study set
      await supabase.from("study_sets").delete().eq("id", studySet.id)
      console.error("[quizzes/create] items error:", itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    return NextResponse.json({ data: studySet }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
