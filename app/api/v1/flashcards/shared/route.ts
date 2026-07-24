import { handleApiError } from "@/lib/utils/api-error";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { STUDY_SET_LIST_SELECT } from "@/features/quizzes/api/study-sets-db";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("study_sets")
      .select(STUDY_SET_LIST_SELECT)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      return handleApiError(error);
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}
