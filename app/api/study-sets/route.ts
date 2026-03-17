import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "my"; // "my", "shared", "archived"
    const search = url.searchParams.get("search") || "";
    const difficulty = url.searchParams.get("difficulty");
    const generationMode = url.searchParams.get("mode");

    let query = supabase
      .from("study_sets")
      .select(`
        id,
        title,
        description,
        visibility,
        generation_mode,
        difficulty,
        question_count,
        tags,
        archived,
        created_at,
        updated_at,
        owner_id
      `)
      .order("created_at", { ascending: false });

    // Filter based on type
    if (type === "my") {
      query = query.eq("owner_id", user.id).eq("archived", false);
    } else if (type === "shared") {
      query = query.eq("visibility", "shared").eq("archived", false);
    } else if (type === "archived") {
      query = query.eq("owner_id", user.id).eq("archived", true);
    }

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    if (generationMode) {
      query = query.eq("generation_mode", generationMode);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch study sets error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ studySets: data || [] });
  } catch (error) {
    console.error("Study sets fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch study sets" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, visibility, tags, archived } = body;

    // Verify ownership
    const { data: studySet } = await supabase
      .from("study_sets")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!studySet || studySet.owner_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to update this study set" }, { status: 403 });
    }

    const { error } = await supabase
      .from("study_sets")
      .update({
        title,
        description,
        visibility,
        tags,
        archived,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Study set update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Study set update error:", error);
    return NextResponse.json({ error: "Failed to update study set" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Study set ID required" }, { status: 400 });
    }

    // Verify ownership
    const { data: studySet } = await supabase
      .from("study_sets")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!studySet || studySet.owner_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to delete this study set" }, { status: 403 });
    }

    const { error } = await supabase
      .from("study_sets")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Study set deletion error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Study set deletion error:", error);
    return NextResponse.json({ error: "Failed to delete study set" }, { status: 500 });
  }
}
