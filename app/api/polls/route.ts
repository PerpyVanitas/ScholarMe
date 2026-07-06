/**
 * GET /api/polls?status=active|closed&page=1&limit=20
 *
 * "active"  = end_date is in the future AND status != 'closed'
 * "closed"  = end_date is in the past OR status == 'closed'
 *
 * Hidden polls are filtered out for non-admins automatically via RLS.
 * The `status` column in the DB is kept for reference but the real
 * source-of-truth for lifecycle is end_date vs now().
 */
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-errors";
import {
  parsePaginationParams,
  createPaginatedResponse,
} from "@/lib/api/pagination";
import { isAdminRole, getRoleName } from "@/lib/utils/roles";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePaginationParams(
      Object.fromEntries(searchParams),
      20,
    );

    // "active" = polls whose end_date is still in the future
    // "closed" = polls that have passed their end_date (or were manually closed)
    const statusParam =
      (searchParams.get("status") as "active" | "closed") || "active";

    const supabase = await createClient();

    // Determine if the caller is an admin (for hidden-poll visibility)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("roles(name)")
        .eq("id", user.id)
        .single();
      const roleName = Array.isArray(profile?.roles)
        ? profile.roles[0]?.name
        : (profile?.roles as any)?.name;
      isAdmin = isAdminRole(roleName);
    }

    const now = new Date().toISOString();

    let query = supabase
      .from("polls")
      .select(
        `
        *,
        profiles:created_by(id, full_name, avatar_url),
        poll_options(id, option_text, display_order)
      `,
        { count: "exact" },
      )
      .order("end_date", { ascending: statusParam === "closed" });

    if (statusParam === "active") {
      // Active: end_date in the future AND not manually closed
      query = query.gt("end_date", now).neq("status", "closed");
    } else {
      // Closed: end_date has passed OR manually set to closed
      query = query.or(`end_date.lte.${now},status.eq.closed`);
    }

    // Non-admins: only show visible polls (RLS also enforces this, but belt-and-suspenders)
    if (!isAdmin) {
      query = query.eq("is_hidden", false);
    }

    const {
      data: polls,
      error,
      count,
    } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        createErrorResponse("DB_001_NOT_FOUND", "Failed to fetch polls"),
        { status: 500 },
      );
    }

    return NextResponse.json(
      createPaginatedResponse(polls || [], page, limit, count || 0),
    );
  } catch {
    return NextResponse.json(
      createErrorResponse(
        "SYSTEM_001_UNKNOWN_ERROR",
        "An unexpected error occurred",
      ),
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse("AUTH_002_SESSION_EXPIRED", "Session expired"),
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();

    const isAdmin = Array.isArray(profile?.roles)
      ? profile.roles.some((role: any) =>
          ["administrator", "super_admin"].includes(role.name),
        )
      : ["administrator", "super_admin"].includes(
          (profile?.roles as any)?.name,
        );

    if (profileError || !isAdmin) {
      return NextResponse.json(
        createErrorResponse("AUTH_003_ADMIN_ONLY", "Admin access required"),
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      end_date,
      options,
      allow_multiple_votes,
      is_anonymous,
    } = body;

    if (!title || !end_date || !options || options.length < 2) {
      return NextResponse.json(
        createErrorResponse("VALID_001_GENERAL", {
          title: !title ? "Title is required" : "",
          end_date: !end_date ? "End date is required" : "",
          options:
            !options || options.length < 2
              ? "At least 2 options are required"
              : "",
        }),
        { status: 400 },
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
        is_hidden: false,
      })
      .select()
      .single();

    if (pollError) {
      return NextResponse.json(
        createErrorResponse(
          "SYSTEM_001_INTERNAL_ERROR",
          "Failed to create poll",
        ),
        { status: 500 },
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
        createErrorResponse(
          "SYSTEM_001_INTERNAL_ERROR",
          "Failed to create poll options",
        ),
        { status: 500 },
      );
    }

    return NextResponse.json(createSuccessResponse(poll), { status: 201 });
  } catch {
    return NextResponse.json(
      createErrorResponse(
        "SYSTEM_001_UNKNOWN_ERROR",
        "An unexpected error occurred",
      ),
      { status: 500 },
    );
  }
}
