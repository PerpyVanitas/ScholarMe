import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-errors";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getBearerToken(request);
    
    if (!token) {
      return NextResponse.json(
        createErrorResponse("AUTH_002_INVALID_TOKEN", "Missing token"),
        { status: 401 }
      );
    }

    const supabase = createSupabaseForBearer(token);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return NextResponse.json(
        createErrorResponse("AUTH_002_SESSION_EXPIRED", "Session expired or invalid token"),
        { status: 401 }
      );
    }
    
    const user = authData.user;
    const { rating, feedback } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        createErrorResponse("VALID_001_GENERAL", "Rating must be 1-5"),
        { status: 400 }
      );
    }

    // Verify that the user is the learner of this session
    const { data: session } = await supabase
      .from("sessions")
      .select("learner_id, tutor_id")
      .eq("id", id)
      .single();

    if (!session) {
      return NextResponse.json(
        createErrorResponse("DB_001_NOT_FOUND", "Session not found"),
        { status: 404 }
      );
    }

    if (session.learner_id !== user.id) {
      return NextResponse.json(
        createErrorResponse("AUTH_003_FORBIDDEN", "You can only rate sessions you participated in"),
        { status: 403 }
      );
    }

    // Check if already rated
    const { data: existingRating } = await supabase
      .from("session_ratings")
      .select("id")
      .eq("session_id", id)
      .eq("learner_id", user.id)
      .maybeSingle();

    if (existingRating) {
      return NextResponse.json(
        createErrorResponse("DB_001_DUPLICATE_RECORD", "You have already rated this session"),
        { status: 400 }
      );
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
      return NextResponse.json(
        createErrorResponse("SYSTEM_001_INTERNAL_ERROR", ratingError.message),
        { status: 500 }
      );
    }

    // Update tutor's average rating (session already fetched above)
    const tutorId = session.tutor_id;

    if (tutorId) {
      const { data: tutor } = await supabase
        .from("tutors")
        .select("rating, total_ratings")
        .eq("id", tutorId)
        .single();

      if (tutor) {
        const newTotal = tutor.total_ratings + 1;
        const newRating =
          (tutor.rating * tutor.total_ratings + rating) / newTotal;

        await supabase
          .from("tutors")
          .update({ rating: newRating, total_ratings: newTotal })
          .eq("id", tutorId);
      }
    }

    return NextResponse.json(createSuccessResponse({ success: true }), { status: 201 });
  } catch (error) {
    console.error("[Android Sessions] POST [id]/rate error:", error);
    return NextResponse.json(
      createErrorResponse("SYSTEM_001_UNKNOWN_ERROR", "Failed to rate session"),
      { status: 500 }
    );
  }
}
