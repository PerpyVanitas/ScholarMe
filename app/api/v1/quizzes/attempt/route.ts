import { handleApiError } from "@/lib/utils/api-error";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { tryUnlockBadge } from "@/lib/utils/badges";
import { z } from "zod";

const postBodySchema = z.object({
  study_set_id: z.string().min(1, "study_set_id is required"),
  answers: z.record(z.string(), z.string()).refine((obj) => Object.keys(obj).length > 0, {
    message: "answers cannot be empty",
  }),
  time_spent_seconds: z.number().optional().default(0), // Default 0 handles `time_spent_seconds || 0`
  // 'score' and 'total_questions' are intentionally ignored per original comment
});

const getSearchParamsSchema = z.object({
  study_set_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const bodyResult = postBodySchema.safeParse(await request.json());

    if (!bodyResult.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { study_set_id, answers, time_spent_seconds } = bodyResult.data;

    // The original check `if (!study_set_id || !answers)` is now handled by the Zod schema's `min(1)` and `refine` checks.

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
        time_spent_seconds, // Used the value parsed by Zod, which defaults to 0 if undefined
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return handleApiError(error);
    }

    if (calculatedScore === totalItems && totalItems > 0) {
      await tryUnlockBadge(supabase, user.id, "quiz_master");
    }

    const hour = new Date().getHours();
    if (hour >= 22 || hour < 5) {
      await tryUnlockBadge(supabase, user.id, "night_owl");
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
    const searchParamsObject = Object.fromEntries(searchParams);

    const parseResult = getSearchParamsSchema.safeParse(searchParamsObject);

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    
    const { study_set_id: studySetId } = parseResult.data;

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
