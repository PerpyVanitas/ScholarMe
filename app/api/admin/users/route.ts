// POST /api/admin/users -- create user
// PATCH /api/admin/users -- edit user details
// DELETE /api/admin/users -- delete user
import { createClient } from "@/lib/supabase/create-client";
import { createClient as createBareAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/utils/roles";

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
    : (profile?.roles as any)?.name;
  const isAdmin = isAdminRole(roleName);

  if (!isAdmin) return null;
  return { user, roleName };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const adminData = await getAdminUser(supabase);
  if (!adminData)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { user: admin, roleName: adminRoleName } = adminData;

  const { email, password, full_name, role_name } = await request.json();
  if (!email || !password || !full_name) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (role_name && role_name !== "learner" && adminRoleName !== "super_admin") {
    return NextResponse.json(
      {
        error: "Only super administrators can assign roles other than learner",
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

  if (authError)
    return NextResponse.json({ error: authError.message }, { status: 500 });

  if (role_name === "tutor" && authData.user) {
    const { error: tutorError } = await adminClient
      .from("tutors")
      .insert({ user_id: authData.user.id });
    if (tutorError) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: tutorError.message }, { status: 500 });
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
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const adminData = await getAdminUser(supabase);
  if (!adminData)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { user: admin, roleName: adminRoleName } = adminData;

  const { user_id, full_name, email, role_name, password, role_expires_at } =
    await request.json();
  if (!user_id)
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

  const adminClient = getAdminSupabase();

  interface ProfileUpdates {
    full_name?: string;
    role_expires_at?: string | null;
    email?: string;
  }
  const profileUpdates: ProfileUpdates = {};
  if (full_name !== undefined) profileUpdates.full_name = full_name;
  if (role_expires_at !== undefined) profileUpdates.role_expires_at = role_expires_at;

  // Update email via auth admin
  if (email) {
    const { error } = await adminClient.auth.admin.updateUserById(user_id, {
      email,
    });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    profileUpdates.email = email;
  }

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await adminClient
      .from("profiles")
      .update(profileUpdates)
      .eq("id", user_id);
    if (profileError)
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 },
      );
  }

  // Update password via auth admin
  if (password) {
    const { error } = await adminClient.auth.admin.updateUserById(user_id, {
      password,
    });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
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
      return NextResponse.json({ error: "Invalid role_name" }, { status: 400 });
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ role_id: roleData.id })
      .eq("id", user_id);
    if (profileError)
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 },
      );

    // Create/remove tutor record
    if (role_name === "tutor") {
      const { error: tutorError } = await adminClient
        .from("tutors")
        .upsert({ user_id }, { onConflict: "user_id" });
      if (tutorError)
        return NextResponse.json(
          { error: tutorError.message },
          { status: 500 },
        );
    } else {
      const { error: tutorError } = await adminClient
        .from("tutors")
        .delete()
        .eq("user_id", user_id);
      if (tutorError)
        return NextResponse.json(
          { error: tutorError.message },
          { status: 500 },
        );
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
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const adminData = await getAdminUser(supabase);
  if (!adminData)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { user: admin } = adminData;

  const { user_id } = await request.json();
  if (!user_id)
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

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

  // Delete profile first (cascade), then auth user
  const { error: profileError } = await adminClient
    .from("profiles")
    .delete()
    .eq("id", user_id);
  if (profileError)
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  const { error } = await adminClient.auth.admin.deleteUser(user_id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
