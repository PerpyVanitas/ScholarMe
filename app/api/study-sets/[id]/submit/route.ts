import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

interface SubmitQuizRequest {
  answers: {
    itemId: string;
    answer: string;
  }[];
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SubmitQuizRequest = await request.json();

    // Fetch study set items to grade the quiz
    const { data: items, error: itemsError } = await supabase
      .from("study_set_items")
      .select("*")
      .eq("study_set_id", id);

    if (itemsError || !items) {
      return NextResponse.json({ error: "Study set not found" }, { status: 404 });
    }

    // Calculate score
    let correctCount = 0;
    const gradedAnswers: Record<string, any> = {};

    body.answers.forEach((submission) => {
      const item = items.find((i) => i.id === submission.itemId);
      if (item) {
        const isCorrect = gradeAnswer(submission.answer, item.answer, item.item_type);
        if (isCorrect) correctCount++;
        gradedAnswers[submission.itemId] = {
          userAnswer: submission.answer,
          correctAnswer: item.answer,
          isCorrect,
        };
      }
    });

    const score = (correctCount / items.length) * 100;

    // Save quiz attempt
    const { data: attempt, error: submitError } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        study_set_id: id,
        score,
        total_items: items.length,
        answers: gradedAnswers,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (submitError) {
      console.error("Quiz submission error:", submitError);
      return NextResponse.json({ error: submitError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      attempt,
      score,
      correctCount,
      totalItems: items.length,
      percentage: score,
    });
  } catch (error) {
    console.error("Quiz submission error:", error);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}

function gradeAnswer(userAnswer: string, correctAnswer: string, itemType: string): boolean {
  const normalize = (str: string) => str.toLowerCase().trim();

  switch (itemType) {
    case "flashcard":
    case "identification":
      // Fuzzy matching for flashcards and identifications
      return normalize(userAnswer).includes(normalize(correctAnswer)) ||
             normalize(correctAnswer).includes(normalize(userAnswer));
    case "multiple_choice":
    case "matching":
      return normalize(userAnswer) === normalize(correctAnswer);
    case "true_false":
      return normalize(userAnswer) === normalize(correctAnswer);
    default:
      return normalize(userAnswer) === normalize(correctAnswer);
  }
}
