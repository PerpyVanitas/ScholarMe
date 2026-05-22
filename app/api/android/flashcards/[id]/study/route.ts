import { createAdminClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();
    
    const { data: studySet, error } = await supabase
      .from("study_sets")
      .select("id, title, description, study_set_items(id, term:prompt, definition:answer)")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        id: studySet.id,
        title: studySet.title,
        description: studySet.description,
        items: studySet.study_set_items.map((i: any) => ({
          id: i.id,
          term: i.term,
          definition: i.definition
        }))
      }
    });
  } catch (error) {
    console.error("[Android Quiz API] Study error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch study set" }, { status: 500 });
  }
}
