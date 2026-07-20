import { handleApiError } from "@/lib/utils/api-error";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { calculateSM2, type SM2Rating } from "@/lib/utils/sm2";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { study_set_item_id, rating } = body as {
      study_set_item_id: string;
      rating: SM2Rating;
    };

    if (!study_set_item_id || rating === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get previous attempt data
    const { data: previousAttempt, error: fetchError } = await supabase
      .from("flashcard_attempts")
      .select("*")
      .eq("user_id", user.id)
      .eq("study_set_item_id", study_set_item_id)
      .maybeSingle();

    if (fetchError) {
      return handleApiError(fetchError);
    }

    // Calculate new SM-2 values
    const prevRepetitions = previousAttempt?.repetitions || 0;
    const prevInterval = previousAttempt?.interval_days || 0;
    const prevEaseFactor = previousAttempt?.ease_factor || 2.5;

    const { interval, easeFactor, repetitions } = calculateSM2(
      rating,
      prevRepetitions,
      prevInterval,
      prevEaseFactor,
    );

    // Calculate next review date based on interval (in days)
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    // Upsert the attempt
    const { data, error } = await supabase
      .from("flashcard_attempts")
      .upsert(
        {
          id: previousAttempt?.id || undefined,
          user_id: user.id,
          study_set_item_id,
          ease_factor: easeFactor,
          interval_days: interval,
          repetitions: repetitions,
          next_review_date: nextReviewDate.toISOString(),
          rating,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,study_set_item_id" },
      )
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
