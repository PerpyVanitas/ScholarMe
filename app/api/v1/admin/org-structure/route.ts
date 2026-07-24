import { z } from "zod";
import { handleApiError } from "@/lib/utils/api-error";
/**
 * GET  /api/admin/org-structure — fetch current term + all assignments
 * POST /api/admin/org-structure — create a new org term (super_admin only)
 * PATCH /api/admin/org-structure — save assignments for current term (super_admin only)
 */
import { createClient } from "@/lib/supabase/create-client";
import { createClient as createBareAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminSupabase() {
  return createBareAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function requireSuperAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const roleName = Array.isArray(profile?.roles)
    ? profile.roles[0]?.name
    : (profile?.roles as { name: string } | undefined)?.name;

  if (roleName !== "super_admin") return null;
  return user;
}

// GET — fetch current term and all assignments joined with profile data
export async function GET() {
  try {
    const adminClient = getAdminSupabase();

    // Get current term
    const { data: term, error: termError } = await adminClient
      .from("org_terms")
      .select("*")
      .eq("is_current", true)
      .maybeSingle();

    if (termError) {
      return NextResponse.json({ error: termError.message }, { status: 500 });
    }

    // Get all terms for history
    const { data: allTerms } = await adminClient
      .from("org_terms")
      .select("*")
      .order("term_start", { ascending: false });

    if (!term) {
      return NextResponse.json({
        term: null,
        assignments: [],
        allTerms: allTerms || [],
      });
    }

    // Get assignments for current term with user profiles
    const { data: assignments, error: assignError } = await adminClient
      .from("org_assignments")
      .select(
        `
        id, position, committee, user_id, created_at,
        profiles:user_id (
          id, full_name, email, avatar_url,
          esas_scholar, membership_classification
        )
      `,
      )
      .eq("term_id", term.id)
      .order("position");

    if (assignError) {
      return NextResponse.json({ error: assignError.message }, { status: 500 });
    }

    // Get all Honor Society members (tutor-tier and above, excluding learners)
    // so the dropdowns have a user list
    const { data: members } = await adminClient
      .from("profiles")
      .select("id, full_name, email, esas_scholar, roles(name)")
      .neq("roles->name", "learner")
      .order("full_name");

    return NextResponse.json({
      term,
      allTerms: allTerms || [],
      assignments: assignments || [],
      members: members || [],
    });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST — create a new term
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await requireSuperAdmin(supabase);
    if (!user) {
      return NextResponse.json(
        { error: "Only Super Admin can create org terms" },
        { status: 403 },
      );
    }

    const PostBodySchema = z.object({
      label: z.string(),
      term_start: z.string(),
      term_end: z.string(),
    });

    const parseResult = PostBodySchema.safeParse(await request.json());

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { label, term_start, term_end } = parseResult.data;

    const adminClient = getAdminSupabase();

    // Mark all existing terms as not current
    await adminClient
      .from("org_terms")
      .update({ is_current: false })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // Insert new term as current
    const { data: newTerm, error } = await adminClient
      .from("org_terms")
      .insert({
        label,
        term_start,
        term_end,
        is_current: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return handleApiError(error);
    }

    await adminClient.from("analytics_logs").insert({
      user_id: user.id,
      action: "org_term_created",
      entity_type: "org_term",
      entity_id: newTerm.id,
      metadata: { label, term_start, term_end },
    });

    return NextResponse.json({ term: newTerm }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH — save or update assignments for the current term
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await requireSuperAdmin(supabase);
    if (!user) {
      return NextResponse.json(
        { error: "Only Super Admin can update org assignments" },
        { status: 403 },
      );
    }

    /**
     * Expected body:
     * {
     *   term_id: string,
     *   assignments: [
     *     { position: "president", committee: null, user_id: "uuid" | null },
     *     { position: "committee_head", committee: "COF", user_id: "uuid" | null },
     *     ...
     *   ]
     * }
     * user_id: null means "clear this position"
     */
    const PatchBodySchema = z.object({
      term_id: z.string().uuid(),
      assignments: z.array(z.object({
        position: z.string(),
        committee: z.string().nullable(),
        user_id: z.string().uuid().nullable(),
      })),
    });

    const parseResult = PatchBodySchema.safeParse(await request.json());

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { term_id, assignments } = parseResult.data;

    const adminClient = getAdminSupabase();

    // Verify term exists
    const { data: term } = await adminClient
      .from("org_terms")
      .select("id, term_end")
      .eq("id", term_id)
      .single();

    if (!term) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }

    // Validate: learner accounts cannot be assigned positions
    for (const a of assignments) {
      if (!a.user_id) continue;
      const { data: memberProfile } = await adminClient
        .from("profiles")
        .select("roles(name)")
        .eq("id", a.user_id)
        .single();
      const memberRole = Array.isArray(memberProfile?.roles)
        ? memberProfile.roles[0]?.name
        : ((memberProfile?.roles as unknown as Record<string, unknown> | null)
            ?.name as string | undefined);
      if (memberRole === "learner") {
        return NextResponse.json(
          {
            error: `Learner accounts cannot be assigned org positions. Convert the account to tutor first.`,
          },
          { status: 400 },
        );
      }
    }

    const errors: string[] = [];
    const updatedAssignments: unknown[] = [];

    for (const a of assignments) {
      const { position, committee, user_id } = a;

      // Find previous holder for this position/committee in this term
      const { data: prev } = await adminClient
        .from("org_assignments")
        .select("id, user_id")
        .eq("term_id", term_id)
        .eq("position", position)
        .eq("committee", committee ?? null)
        .maybeSingle();

      // If clearing the position
      if (!user_id) {
        if (prev) {
          // Remove assignment
          await adminClient.from("org_assignments").delete().eq("id", prev.id);
          // Revert previous holder to tutor if they have no other active assignment
          await revertToTutorIfUnassigned(adminClient, prev.user_id, term_id);
        }
        continue;
      }

      // Upsert the assignment
      if (prev) {
        // Assignment exists — update it
        const { data: updated, error: updateErr } = await adminClient
          .from("org_assignments")
          .update({ user_id, updated_at: new Date().toISOString() })
          .eq("id", prev.id)
          .select()
          .single();

        if (updateErr) {
          errors.push(`Failed to update ${position}: ${updateErr.message}`);
          continue;
        }

        // Revert old holder if different
        if (prev.user_id !== user_id) {
          await revertToTutorIfUnassigned(adminClient, prev.user_id, term_id);
        }

        updatedAssignments.push(updated);
      } else {
        // New assignment
        const { data: inserted, error: insertErr } = await adminClient
          .from("org_assignments")
          .insert({ term_id, user_id, position, committee: committee ?? null })
          .select()
          .single();

        if (insertErr) {
          errors.push(`Failed to assign ${position}: ${insertErr.message}`);
          continue;
        }
        updatedAssignments.push(inserted);
      }

      // Update the user's role_id to reflect their new position
      await applyRoleFromPosition(
        adminClient,
        user_id,
        position,
        term.term_end,
      );
    }

    await adminClient.from("analytics_logs").insert({
      user_id: user.id,
      action: "org_assignments_updated",
      entity_type: "org_term",
      entity_id: term_id,
      metadata: { count: updatedAssignments.length, errors },
    });

    return NextResponse.json({
      success: true,
      updated: updatedAssignments.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Map a position name to the corresponding role name in the roles table */
function positionToRoleName(position: string): string {
  const map: Record<string, string> = {
    president: "president",
    vice_president: "vice_president",
    secretary: "secretary",
    treasurer: "treasurer",
    auditor: "auditor",
    committee_head: "committee_head",
    assistant_committee_head: "assistant_committee_head",
  };
  return map[position] ?? "tutor";
}

/** Set the user's role_id to match their org position, with expiry on term end */
async function applyRoleFromPosition(
  adminClient: ReturnType<typeof getAdminSupabase>,
  user_id: string,
  position: string,
  term_end: string,
) {
  const roleName = positionToRoleName(position);
  const { data: role } = await adminClient
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .single();

  if (!role) return;

  // Don't downgrade system roles (administrator/super_admin stay as-is)
  const { data: currentProfile } = await adminClient
    .from("profiles")
    .select("roles(name)")
    .eq("id", user_id)
    .single();

  const currentRole = Array.isArray(currentProfile?.roles)
    ? currentProfile.roles[0]?.name
    : ((currentProfile?.roles as unknown as Record<string, unknown> | null)?.name as
        string | undefined);

  if (currentRole === "super_admin" || currentRole === "administrator") {
    // Don't overwrite system roles — store assignment only, don't change role_id
    return;
  }

  await adminClient
    .from("profiles")
    .update({ role_id: role.id, role_expires_at: term_end })
    .eq("id", user_id);
}

/** Revert a user to tutor role if they have no other active assignment in the current term */
async function revertToTutorIfUnassigned(
  adminClient: ReturnType<typeof getAdminSupabase>,
  user_id: string,
  term_id: string,
) {
  const { data: remaining } = await adminClient
    .from("org_assignments")
    .select("id")
    .eq("term_id", term_id)
    .eq("user_id", user_id);

  if (remaining && remaining.length > 0) return; // still has another assignment

  const { data: tutorRole } = await adminClient
    .from("roles")
    .select("id")
    .eq("name", "tutor")
    .single();

  if (!tutorRole) return;

  // Don't downgrade admins
  const { data: currentProfile } = await adminClient
    .from("profiles")
    .select("roles(name)")
    .eq("id", user_id)
    .single();

  const currentRole = Array.isArray(currentProfile?.roles)
    ? currentProfile.roles[0]?.name
    : ((currentProfile?.roles as unknown as Record<string, unknown> | null)?.name as
        string | undefined);

  if (currentRole === "super_admin" || currentRole === "administrator") return;

  await adminClient
    .from("profiles")
    .update({ role_id: tutorRole.id, role_expires_at: null })
    .eq("id", user_id);
}
