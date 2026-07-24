import { z } from "zod";
import { handleApiError } from "@/lib/utils/api-error";
// POST /api/admin/users -- create user
// PATCH /api/admin/users -- edit user details
// DELETE /api/admin/users -- delete user
import { createClient } from "@/lib/supabase/create-client";
import { createClient as createBareAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { GOVERNANCE_ROLES, hasAnyRole } from "@/lib/utils/roles";

function getAdminSupabase() {
  return createBareAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getAdminUser(
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
  const isAuthorized = hasAnyRole(roleName as string, GOVERNANCE_ROLES);

  if (!isAuthorized) return null;
  return { user, roleName };
}

const postSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6), // Supabase default min password length is 6
  full_name: z.string().min(1),
  role_name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminData = await getAdminUser(supabase);
    if (!adminData)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { user: admin, roleName: adminRoleName } = adminData;

    const body = await request.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password, full_name, role_name } = parsed.data;

    if (
      role_name &&
      role_name !== "learner" &&
      adminRoleName !== "super_admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Only super administrators can assign roles other than learner",
        },
        { status: 403 },
      );
    }

    const adminClient = getAdminSupabase();

    const { data: roleData } = await adminClient
      .from("roles")
      .select("id")
      .eq("name", role_name || "learner")
      .single();

    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role_id: roleData?.id },
      });

    if (authError) return handleApiError(authError);

    if (role_name === "tutor" && authData.user) {
      const { error: tutorError } = await adminClient
        .from("tutors")
        .insert({ user_id: authData.user.id });
      if (tutorError) {
        await adminClient.auth.admin.deleteUser(authData.user.id);
        return handleApiError(tutorError);
      }
    }

    // Log action
    await adminClient.from("analytics_logs").insert({
      user_id: admin.id,
      action: "user_created",
      entity_type: "user",
      entity_id: authData.user?.id,
      metadata: { email, role_name, created_by: admin.email },
    });

    return NextResponse.json({ user: authData.user }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

const patchSchema = z.object({
  user_id: z.string().uuid(), // Assuming it's a UUID for Supabase user ID
  full_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role_name: z.string().optional(),
  password: z.string().min(6).optional(), // Supabase default min password length is 6
  role_expires_at: z.string().datetime().nullable().optional(), // Assuming it's an ISO date string
});

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const adminData = await getAdminUser(supabase);
    if (!adminData)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { user: admin, roleName: adminRoleName } = adminData;

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { user_id, full_name, email, role_name, password, role_expires_at } =
      parsed.data;

    const adminClient = getAdminSupabase();

    interface ProfileUpdates {
      full_name?: string;
      role_expires_at?: string | null;
      email?: string;
    }
    const profileUpdates: ProfileUpdates = {};
    if (full_name !== undefined) profileUpdates.full_name = full_name;
    if (role_expires_at !== undefined)
      profileUpdates.role_expires_at = role_expires_at;

    // Update email via auth admin
    if (email) {
      const { error } = await adminClient.auth.admin.updateUserById(user_id, {
        email,
      });
      if (error) return handleApiError(error);
      profileUpdates.email = email;
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await adminClient
        .from("profiles")
        .update(profileUpdates)
        .eq("id", user_id);
      if (profileError) return handleApiError(profileError);
    }

    // Update password via auth admin
    if (password) {
      const { error } = await adminClient.auth.admin.updateUserById(user_id, {
        password,
      });
      if (error) return handleApiError(error);
    }

    // Update role
    if (role_name) {
      if (adminRoleName !== "super_admin") {
        return NextResponse.json(
          { error: "Only super administrators can change roles" },
          { status: 403 },
        );
      }

      const { data: roleData } = await adminClient
        .from("roles")
        .select("id")
        .eq("name", role_name)
        .single();

      if (!roleData) {
        return NextResponse.json(
          { error: "Invalid role_name" },
          { status: 400 },
        );
      }

      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ role_id: roleData.id })
        .eq("id", user_id);
      if (profileError) return handleApiError(profileError);

      // Create/remove tutor record
      if (role_name === "tutor") {
        const { error: tutorError } = await adminClient
          .from("tutors")
          .upsert({ user_id }, { onConflict: "user_id" });
        if (tutorError) return handleApiError(tutorError);
      } else {
        const { error: tutorError } = await adminClient
          .from("tutors")
          .delete()
          .eq("user_id", user_id);
        if (tutorError) return handleApiError(tutorError);
      }
    }

    // Log action
    await adminClient.from("analytics_logs").insert({
      user_id: admin.id,
      action: "user_edited",
      entity_type: "user",
      entity_id: user_id,
      metadata: {
        full_name,
        email,
        role_name,
        password_changed: !!password,
        edited_by: admin.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

const deleteSchema = z.object({
  user_id: z.string().uuid(), // Assuming it's a UUID for Supabase user ID
});

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const adminData = await getAdminUser(supabase);
    if (!adminData)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { user: admin } = adminData;

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { user_id } = parsed.data;

    if (user_id === admin.id) {
      return NextResponse.json(
        { error: "Cannot delete your own admin account" },
        { status: 400 },
      );
    }

    const adminClient = getAdminSupabase();

    // Get user info for logging
    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", user_id)
      .single();

    // Log before deleting
    await adminClient.from("analytics_logs").insert({
      user_id: admin.id,
      action: "user_deleted",
      entity_type: "user",
      entity_id: user_id,
      metadata: {
        deleted_email: profile?.email,
        deleted_name: profile?.full_name,
        deleted_by: admin.email,
      },
    });

    // Delete user's resources and repositories manually to prevent floating data
    await adminClient.from("resources").delete().eq("uploaded_by", user_id);
    await adminClient.from("repositories").delete().eq("owner_id", user_id);

    // Delete profile first (cascade), then auth user
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", user_id);
    if (profileError) return handleApiError(profileError);
    const { error } = await adminClient.auth.admin.deleteUser(user_id);

    if (error) return handleApiError(error);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
