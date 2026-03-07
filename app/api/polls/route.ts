/** GET /api/polls?page=1&limit=20 -- List active polls with pagination */
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-errors";
import { parsePaginationParams, createPaginatedResponse } from "@/lib/api/pagination";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePaginationParams(
      Object.fromEntries(searchParams),
      20
    );
    
    const status = (searchParams.get("status") as string) || "active";

    const supabase = await createClient();

    // Get paginated polls with count
    const { data: polls, error, count } = await supabase
      .from("polls")
      .select(`
        *,
        profiles:created_by(id, full_name, avatar_url),
        poll_options(id, option_text, display_order)
      `, { count: "exact" })
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        createErrorResponse("DB_001", "Failed to fetch polls"),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createPaginatedResponse(polls || [], page, limit, count || 0)
    );
  } catch {
    return NextResponse.json(
      createErrorResponse("SYSTEM_001", "An unexpected error occurred"),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse("AUTH_002", "Session expired"),
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, roles(*)")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.roles?.name !== "administrator") {
      return NextResponse.json(
        createErrorResponse("AUTH_003", "Admin access required"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, end_date, options, allow_multiple_votes, is_anonymous } = body;

    if (!title || !end_date || !options || options.length < 2) {
      return NextResponse.json(
        createErrorResponse("VALID_001", {
          title: !title ? "Title is required" : "",
          end_date: !end_date ? "End date is required" : "",
          options: !options || options.length < 2 ? "At least 2 options are required" : "",
        }),
        { status: 400 }
      );
    }

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        title,
        description,
        created_by: user.id,
        end_date,
        allow_multiple_votes: allow_multiple_votes || false,
        is_anonymous: is_anonymous || false,
      })
      .select()
      .single();

    if (pollError) {
      return NextResponse.json(
        createErrorResponse("SYSTEM_001", "Failed to create poll"),
        { status: 500 }
      );
    }

    // Create options
    const optionsToInsert = options.map((text: string, index: number) => ({
      poll_id: poll.id,
      option_text: text,
      display_order: index,
    }));

    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(optionsToInsert);

    if (optionsError) {
      // Rollback poll creation
      await supabase.from("polls").delete().eq("id", poll.id);
      return NextResponse.json(
        createErrorResponse("SYSTEM_001", "Failed to create poll options"),
        { status: 500 }
      );
    }

    return NextResponse.json(createSuccessResponse(poll), { status: 201 });
  } catch {
    return NextResponse.json(
      createErrorResponse("SYSTEM_001", "An unexpected error occurred"),
      { status: 500 }
    );
  }
}
