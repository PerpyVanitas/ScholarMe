import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch study set
    const { data: studySet, error: setError } = await supabase
      .from("study_sets")
      .select("*")
      .eq("id", id)
      .single();

    if (setError || !studySet) {
      return NextResponse.json({ error: "Study set not found" }, { status: 404 });
    }

    // Check access permissions (owner or shared)
    if (studySet.visibility === "private" && studySet.owner_id !== user?.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch study set items
    const { data: items, error: itemsError } = await supabase
      .from("study_set_items")
      .select("*")
      .eq("study_set_id", id)
      .order("order_index", { ascending: true });

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Fetch user's quiz attempts if they're the owner
    let attempts = null;
    if (user?.id === studySet.owner_id) {
      const { data: attemptData } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("study_set_id", id)
        .order("created_at", { ascending: false })
        .limit(10);
      attempts = attemptData;
    }

    return NextResponse.json({
      studySet,
      items: items || [],
      attempts,
    });
  } catch (error) {
    console.error("Fetch study set error:", error);
    return NextResponse.json({ error: "Failed to fetch study set" }, { status: 500 });
  }
}
