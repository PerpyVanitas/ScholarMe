import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { hasAnyRole, TUTOR_ROLES } from "@/lib/utils/roles";
import type { UserRole } from "@/lib/types";

const QuerySchema = z.object({
  q: z.string().min(2).max(100),
});

/**
 * GET /api/v1/users/search?q=<query>
 *
 * Role-based user search with block filtering:
 *  - Learners: only see users with role = 'tutor'
 *  - Tutor and above: see all users (except blocked)
 *  - Blocked users are excluded from both sides (blocker + blocked)
 *
 * Backed by a GIN trigram index on profiles.full_name for sub-100ms ILIKE.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({ q: searchParams.get("q") ?? "" });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { q } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch caller's role
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role_id, roles:role_id(name)")
    .eq("id", user.id)
    .maybeSingle();

  const callerRoleRaw = callerProfile?.roles;
  const callerRole: UserRole = Array.isArray(callerRoleRaw)
    ? ((callerRoleRaw[0]?.name ?? "learner") as UserRole)
    : (((callerRoleRaw as { name?: string })?.name ?? "learner") as UserRole);

  const isTutorOrAbove = hasAnyRole(callerRole, TUTOR_ROLES);

  // Fetch IDs of users the caller has blocked or who have blocked the caller
  const [{ data: theyBlocked }, { data: blockedBy }] = await Promise.all([
    supabase
      .from("user_blocks")
      .select("blocked_id")
      .eq("blocker_id", user.id),
    supabase
      .from("user_blocks")
      .select("blocker_id")
      .eq("blocked_id", user.id),
  ]);

  const excludedIds = new Set<string>([
    user.id, // never show yourself
    ...(theyBlocked?.map((r) => r.blocked_id) ?? []),
    ...(blockedBy?.map((r) => r.blocker_id) ?? []),
  ]);

  // Build the base query
  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, avatar_url, email, degree_program, year_level, membership_number, total_xp, created_at, roles:role_id(name), bio",
    )
    .ilike("full_name", `%${q}%`)
    .limit(8);

  if (!isTutorOrAbove) {
    // Learners can only see tutors
    const { data: tutorRoleRow } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "tutor")
      .maybeSingle();

    if (tutorRoleRow?.id) {
      query = query.eq("role_id", tutorRoleRow.id);
    } else {
      // Role not found — return empty safely
      return NextResponse.json([]);
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  // Filter out blocked users client-side (avoids complex NOT IN with large sets)
  const results = (data ?? []).filter((u) => !excludedIds.has(u.id));

  return NextResponse.json(results);
}
