import { z } from "zod";
import { handleApiError } from "@/lib/utils/api-error";
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

    const FeedbackSchema = z.object({
      content: z.string().trim().min(1, "Feedback content is required"),
    });

    const body = await request.json();
    const parsedBody = FeedbackSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { content } = parsedBody.data;

    const { data: feedback, error } = await supabase
      .from("system_feedback")
      .insert({
        user_id: user.id,
        content: content, // content is already trimmed by Zod schema
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return handleApiError(error);
    }

    return NextResponse.json(createSuccessResponse(feedback), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
