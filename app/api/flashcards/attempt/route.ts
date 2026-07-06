import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    // We ignore the 'score' and 'total_questions' passed by the client to prevent manipulation
    const { study_set_id, answers, time_spent_seconds } = body;

    if (!study_set_id || !answers) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Fetch the correct answers from the database securely
    const { data: studySetItems, error: fetchError } = await supabase
      .from("study_set_items")
      .select("id, answer")
      .eq("study_set_id", study_set_id);

    if (fetchError || !studySetItems) {
      return NextResponse.json(
        { error: "Failed to validate answers" },
        { status: 500 },
      );
    }

    let calculatedScore = 0;
    const totalItems = studySetItems.length;

    // The client answers map is expected to be { [item_id]: "User's string answer" }
    for (const item of studySetItems) {
      const userAnswer = answers[item.id];
      if (
        userAnswer &&
        String(userAnswer).toLowerCase() === String(item.answer).toLowerCase()
      ) {
        calculatedScore += 1;
      }
    }

    const { data, error } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        study_set_id,
        score: calculatedScore,
        total_items: totalItems,
        total_questions: totalItems,
        answers,
        time_spent_seconds: time_spent_seconds || 0,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[API Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studySetId = searchParams.get("study_set_id");

    let query = supabase
      .from("quiz_attempts")
      .select(
        `
        *,
        study_sets(title, type:generation_mode)
      `,
      )
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    if (studySetId) {
      query = query.eq("study_set_id", studySetId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("[API Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
