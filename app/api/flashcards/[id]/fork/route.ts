import { handleApiError } from "@/lib/utils/api-error";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch original study set
    const { data: originalSet, error: fetchError } = await supabase
      .from("study_sets")
      .select("*, study_set_items(*)")
      .eq("id", id)
      .single();

    if (fetchError || !originalSet) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 },
      );
    }

    // 2. Create new forked study set
    const { data: newSet, error: insertError } = await supabase
      .from("study_sets")
      .insert({
        title: `${originalSet.title} (Forked)`,
        description: originalSet.description,
        type: originalSet.type,
        is_public: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 3. Clone items
    if (originalSet.study_set_items && originalSet.study_set_items.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemsToInsert = originalSet.study_set_items.map((item: any) => ({
        study_set_id: newSet.id,
        question: item.question,
        answer: item.answer,
        options: item.options,
        item_type: item.item_type,
        order_index: item.order_index,
      }));

      const { error: itemsError } = await supabase
        .from("study_set_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return NextResponse.json({ success: true, data: newSet });
  } catch (error) {
    return handleApiError(error);
  }
}
