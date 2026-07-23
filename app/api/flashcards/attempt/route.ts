import { handleApiError } from "@/lib/utils/api-error";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const postBodySchema = z.object({
      study_set_id: z.string().min(1, "Study set ID is required"),
      answers: z.record(z.string(), z.string()).refine(val => Object.keys(val).length > 0, "Answers are required"),
      time_spent_seconds: z.number().int().nonnegative().optional(),
    });

    const body = await request.json();
    const parsedBody = postBodySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // We ignore the 'score' and 'total_questions' passed by the client to prevent manipulation
    const { study_set_id, answers, time_spent_seconds } = parsedBody.data;

    // Original check `if (!study_set_id || !answers)` is now handled by Zod schema

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
      return handleApiError(error);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
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

    const getSearchParamsSchema = z.object({
      study_set_id: z.string().optional(),
    });

    const params = Object.fromEntries(searchParams);
    const parsedParams = getSearchParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { study_set_id: studySetId } = parsedParams.data;

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
      return handleApiError(error);
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}
