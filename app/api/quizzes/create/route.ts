import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

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

    // Create study set
    const { data: studySet, error: setError } = await supabase
      .from("study_sets")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        type: type || "flashcard",
        is_public: is_public || false,
        source_type: source_type || "manual",
      })
      .select()
      .single()

    if (setError) {
      return NextResponse.json({ error: setError.message }, { status: 500 })
    }

    // Add items if provided
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any, index: number) => ({
        study_set_id: studySet.id,
        question: item.question,
        answer: item.answer,
        options: item.options || null,
        item_type: item.item_type || "flashcard",
        order_index: index,
      }))

      const { error: itemsError } = await supabase
        .from("study_set_items")
        .insert(itemsToInsert)

      if (itemsError) {
        // Rollback: delete the study set
        await supabase.from("study_sets").delete().eq("id", studySet.id)
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ data: studySet })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
