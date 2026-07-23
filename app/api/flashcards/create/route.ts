import { handleApiError } from "@/lib/utils/api-error";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  buildStudySetInsert,
  buildStudySetItemInsert,
} from "@/features/quizzes/api/study-sets-db";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      is_public,
      source_type,
      source_resource_id,
      items,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create study set
    const { data: studySet, error: setError } = await supabase
      .from("study_sets")
      .insert(
        buildStudySetInsert(user.id, {
          title: title.trim(),
          description: description?.trim() || null,
          type,
          is_public,
          source_type,
          source_resource_id,
        }),
      )
      .select()
      .single();

    if (setError) {
      return NextResponse.json({ error: setError.message }, { status: 500 });
    }

    // Add items if provided
    if (items && items.length > 0) {
      const itemsToInsert = items.map(
        (
          item: {
            question: string;
            answer: string;
            options?: unknown;
            item_type?: string;
          },
          index: number,
        ) => buildStudySetItemInsert(studySet.id, item, index),
      );

      const { error: itemsError } = await supabase
        .from("study_set_items")
        .insert(itemsToInsert);

      if (itemsError) {
        // Rollback: delete the study set
        await supabase.from("study_sets").delete().eq("id", studySet.id);
        return NextResponse.json(
          { error: itemsError.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ data: studySet });
  } catch (error) {
    return handleApiError(error);
  }
}
