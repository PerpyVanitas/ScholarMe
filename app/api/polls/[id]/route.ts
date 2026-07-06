/** PATCH /api/polls/[id] — Update poll title, description, end_date (admin only) */
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-errors";
import { isAdminRole } from "@/lib/utils/roles";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: pollId } = await params;
  const supabase = await createClient();

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

  // Admin check
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const roleName = Array.isArray(profile?.roles)
    ? profile.roles[0]?.name
    : (profile?.roles as any)?.name;

  if (!isAdminRole(roleName)) {
    return NextResponse.json(
      createErrorResponse("AUTH_003_ADMIN_ONLY", "Admin access required"),
      { status: 403 },
    );
  }

  const body = await request.json();
  const { title, description, end_date } = body;

  if (!title || !end_date) {
    return NextResponse.json(
      createErrorResponse(
        "VALID_001_GENERAL",
        "Title and end date are required",
      ),
      { status: 400 },
    );
  }

  const { data: updated, error } = await supabase
    .from("polls")
    .update({ title, description: description || null, end_date })
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
