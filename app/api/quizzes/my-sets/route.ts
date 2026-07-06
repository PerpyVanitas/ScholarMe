import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { STUDY_SET_LIST_SELECT } from "@/lib/study-sets/db";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("study_sets")
      .select(STUDY_SET_LIST_SELECT)
      .eq("user_id", user.id)
      .neq("generation_mode", "flashcard")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("[API Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
