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
    const { study_set_id, score, total_questions, answers, time_spent_seconds } = body

    const { data, error } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        study_set_id,
        score,
        total_questions,
        answers,
        time_spent_seconds,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studySetId = searchParams.get("study_set_id")

    let query = supabase
      .from("quiz_attempts")
      .select(`
        *,
        study_sets(title, type)
      `)
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })

    if (studySetId) {
      query = query.eq("study_set_id", studySetId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
