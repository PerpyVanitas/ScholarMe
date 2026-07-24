import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/utils/api-error";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Session expired", code: "AUTH_002_SESSION_EXPIRED" },
        { status: 401 },
      );
    }

    const reportBodySchema = z.object({
      postId: z.string(),
      reason: z.string(),
    });

    const parsedBody = reportBodySchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { postId, reason } = parsedBody.data;

    const { error: insertError } = await supabase
      .from('forum_reports')
      .insert({
        post_id: postId,
        reporter_id: user.id,
        reason: reason,
        status: 'pending'
      });

    if (insertError) {
      return handleApiError(insertError, 500);
    }

    return NextResponse.json({ success: true, message: "Report submitted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
