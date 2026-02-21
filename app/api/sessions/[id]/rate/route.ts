/** POST /api/sessions/[id]/rate -- submit a 1-5 star rating and recalculate the tutor's average. */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rating, feedback } = await request.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  // Insert the rating
  const { error: ratingError } = await supabase
    .from("session_ratings")
    .insert({
      session_id: id,
      learner_id: user.id,
      rating,
      feedback: feedback || null,
    });

  if (ratingError) {
    return NextResponse.json({ error: ratingError.message }, { status: 500 });
  }

  // Update tutor's average rating
  const { data: session } = await supabase
    .from("sessions")
    .select("tutor_id")
    .eq("id", id)
    .single();

  if (session) {
    const { data: tutor } = await supabase
      .from("tutors")
      .select("rating, total_ratings")
      .eq("id", session.tutor_id)
      .single();

    if (tutor) {
      const newTotal = tutor.total_ratings + 1;
      const newRating =
        (tutor.rating * tutor.total_ratings + rating) / newTotal;

      await supabase
        .from("tutors")
        .update({ rating: newRating, total_ratings: newTotal })
        .eq("id", session.tutor_id);
    }
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
