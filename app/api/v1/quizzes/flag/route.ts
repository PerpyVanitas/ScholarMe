import { handleApiError } from "@/lib/utils/api-error";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const flagSchema = z.object({
  study_set_item_id: z.string().uuid(),
  reason: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parseResult = flagSchema.safeParse(await req.json());
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 },
      );
    }

    const { study_set_item_id, reason } = parseResult.data;

    const { data, error } = await supabase
      .from("quiz_question_flags")
      .insert({
        user_id: user.id,
        study_set_item_id,
        reason,
        status: "pending",
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
