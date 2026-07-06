/**
 * PATCH /api/polls/[id]  — Update poll (admin only, with date-window enforcement)
 * DELETE /api/polls/[id] — Delete poll (admin only, with date-window enforcement)
 *
 * Permission matrix:
 *   - administrator:  can edit/delete only while end_date is in the future (active window)
 *   - super_admin:    can edit/delete any poll regardless of date
 *
 * PATCH also accepts `is_hidden` to toggle visibility of closed polls from regular users.
 */
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-errors";
import { isAdminRole } from "@/lib/utils/roles";

/** Resolve the caller's role name and whether they are a super_admin */
async function resolveRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", userId)
    .single();

  const roleName: string | undefined = Array.isArray(profile?.roles)
    ? profile.roles[0]?.name
    : (profile?.roles as any)?.name;

  return {
    roleName,
    isAdmin: isAdminRole(roleName),
    isSuperAdmin: roleName === "super_admin",
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: pollId } = await params;
  const supabase = await createClient();

  // ── Auth ──────────────────────────────────────────────────────────────────
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

  const { isAdmin, isSuperAdmin } = await resolveRole(supabase, user.id);
  if (!isAdmin) {
    return NextResponse.json(
      createErrorResponse("AUTH_003_ADMIN_ONLY", "Admin access required"),
      { status: 403 },
    );
  }

  // ── Fetch the poll ────────────────────────────────────────────────────────
  const { data: poll, error: pollFetchError } = await supabase
    .from("polls")
    .select("id, end_date, status")
    .eq("id", pollId)
    .single();

  if (pollFetchError || !poll) {
    return NextResponse.json(
      createErrorResponse("DB_001_NOT_FOUND", "Poll not found"),
      { status: 404 },
    );
  }

  // ── Date-window gate ─────────────────────────────────────────────────────
  const isPollActive =
    new Date(poll.end_date) > new Date() && poll.status !== "closed";

  if (!isPollActive && !isSuperAdmin) {
    return NextResponse.json(
      createErrorResponse(
        "AUTH_003_ADMIN_ONLY",
        "This poll has ended. Only super admins can edit closed polls.",
      ),
      { status: 403 },
    );
  }

  // ── Parse + validate body ─────────────────────────────────────────────────
  const body = await request.json();
  const { title, description, end_date, is_hidden } = body;

  if (!title || !end_date) {
    return NextResponse.json(
      createErrorResponse(
        "VALID_001_GENERAL",
        "Title and end date are required",
      ),
      { status: 400 },
    );
  }

  // Build update payload — only super_admin can change is_hidden
  const updatePayload: Record<string, unknown> = {
    title,
    description: description || null,
    end_date,
    updated_at: new Date().toISOString(),
  };

  // Both admin and super_admin can toggle is_hidden
  if (typeof is_hidden === "boolean") {
    updatePayload.is_hidden = is_hidden;
  }

  const { data: updated, error } = await supabase
    .from("polls")
    .update(updatePayload)
    .eq("id", pollId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      createErrorResponse("SYSTEM_001_DATABASE_ERROR", error.message),
      { status: 500 },
    );
  }

  return NextResponse.json(createSuccessResponse(updated));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: pollId } = await params;
  const supabase = await createClient();

  // ── Auth ──────────────────────────────────────────────────────────────────
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

  const { isAdmin, isSuperAdmin } = await resolveRole(supabase, user.id);
  if (!isAdmin) {
    return NextResponse.json(
      createErrorResponse("AUTH_003_ADMIN_ONLY", "Admin access required"),
      { status: 403 },
    );
  }

  // ── Fetch the poll ────────────────────────────────────────────────────────
  const { data: poll, error: pollFetchError } = await supabase
    .from("polls")
    .select("id, end_date, status")
    .eq("id", pollId)
    .single();

  if (pollFetchError || !poll) {
    return NextResponse.json(
      createErrorResponse("DB_001_NOT_FOUND", "Poll not found"),
      { status: 404 },
    );
  }

  // ── Date-window gate ─────────────────────────────────────────────────────
  const isPollActive =
    new Date(poll.end_date) > new Date() && poll.status !== "closed";

  if (!isPollActive && !isSuperAdmin) {
    return NextResponse.json(
      createErrorResponse(
        "AUTH_003_ADMIN_ONLY",
        "This poll has ended. Only super admins can delete closed polls.",
      ),
      { status: 403 },
    );
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const { error } = await supabase.from("polls").delete().eq("id", pollId);

  if (error) {
    return NextResponse.json(
      createErrorResponse("SYSTEM_001_DATABASE_ERROR", error.message),
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
