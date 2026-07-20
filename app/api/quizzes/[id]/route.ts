import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { STUDY_SET_DETAIL_SELECT } from "@/features/quizzes/api/study-sets-db";
import { handleApiError } from "@/lib/utils/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("study_sets")
      .select(STUDY_SET_DETAIL_SELECT)
      .eq("id", id)
      .single();

    if (error) {
      return handleApiError(error, 404);
    }

    // Check access: owner or public
    if (!data.is_public && data.user_id !== user?.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { error } = await supabase
      .from("study_sets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return handleApiError(error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
