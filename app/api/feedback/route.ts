import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-errors";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse("AUTH_002_SESSION_EXPIRED", "Session expired"),
        { status: 401 },
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        createErrorResponse(
          "VALID_001_GENERAL",
          "Feedback content is required",
        ),
        { status: 400 },
      );
    }

    const { data: feedback, error } = await supabase
      .from("system_feedback")
      .insert({
        user_id: user.id,
        content: content.trim(),
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Feedback insert error:", error);
      return NextResponse.json(
        createErrorResponse(
          "SYSTEM_001_INTERNAL_ERROR",
          "Failed to submit feedback",
        ),
        { status: 500 },
      );
    }

    return NextResponse.json(createSuccessResponse(feedback), { status: 201 });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      createErrorResponse(
        "SYSTEM_001_UNKNOWN_ERROR",
        "An unexpected error occurred",
      ),
      { status: 500 },
    );
  }
}
