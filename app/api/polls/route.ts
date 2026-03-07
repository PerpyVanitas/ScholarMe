/** GET /api/polls - List active polls, POST - Create poll (admin only) */
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/error-codes";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "active";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

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
      createErrorResponse("DB_001_NOT_FOUND", error.message),
      { status: 500 }
    );
  }

  return NextResponse.json(
    createSuccessResponse({
      polls,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      createErrorResponse("AUTH_003_FORBIDDEN", "Authentication required"),
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(*)")
    .eq("id", user.id)
    .single();

  if (profile?.roles?.name !== "administrator") {
    return NextResponse.json(
      createErrorResponse("AUTH_003_ADMIN_ONLY", "Only administrators can create polls"),
      { status: 403 }
    );
  }

  const body = await request.json();
  const { title, description, end_date, options, allow_multiple_votes, is_anonymous } = body;

  if (!title || !end_date || !options || options.length < 2) {
    return NextResponse.json(
      createErrorResponse("VALID_001_GENERAL", {
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
      createErrorResponse("SYSTEM_001_DATABASE_ERROR", pollError.message),
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
      createErrorResponse("SYSTEM_001_DATABASE_ERROR", optionsError.message),
      { status: 500 }
    );
  }

  return NextResponse.json(createSuccessResponse(poll), { status: 201 });
}
