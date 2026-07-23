import { z } from "zod";
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

    // Zod schema definition for the request body
    const studySetSchema = z.object({
      title: z.string().trim().min(1, "Title is required"),
      description: z.string().trim().nullable().optional(),
      type: z.string(), // Inferred from usage, adjust if specific enum/literal needed
      is_public: z.boolean(), // Inferred from usage
      source_type: z.string().nullable().optional(), // Inferred from usage, nullable/optional
      source_resource_id: z.string().nullable().optional(), // Inferred from usage, nullable/optional
      items: z.array(
        z.object({
          question: z.string().min(1, "Question is required"),
          answer: z.string().min(1, "Answer is required"),
          options: z.unknown().optional(), // `unknown` as no specific structure was inferred
          item_type: z.string().optional(),
        })
      ).optional(),
    });

    const parseResult = studySetSchema.safeParse(await request.json());

    if (!parseResult.success) {
      // Return a 400 Bad Request if validation fails
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Destructure the validated and transformed data
    const {
      title,
      description,
      type,
      is_public,
      source_type,
      source_resource_id,
      items,
    } = parseResult.data;

    // Original manual title validation is now handled by Zod's .min(1)
    // if (!title?.trim()) {
    //   return NextResponse.json({ error: "Title is required" }, { status: 400 });
    // }

    // Create study set
    const { data: studySet, error: setError } = await supabase
      .from("study_sets")
      .insert(
        buildStudySetInsert(user.id, {
          title: title, // Already trimmed by Zod
          description: description ?? undefined, // Coerce null to undefined
          type,
          is_public,
          source_type: source_type ?? undefined,
          source_resource_id: source_resource_id ?? undefined,
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
