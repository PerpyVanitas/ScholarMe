// POST /api/admin/users -- create user
// PATCH /api/admin/users -- edit user details
// DELETE /api/admin/users -- delete user
import { createClient } from "@/lib/supabase/create-client";
import { createClient as createBareAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminSupabase() {
  return createBareAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAdminUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();
  const roles = profile?.roles as any;
  const isAdmin = Array.isArray(roles)
    ? roles.some((r) => r.name === "administrator")
    : roles?.name === "administrator";
  if (!isAdmin) return null;
  return user;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = await getAdminUser(supabase);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { email, password, full_name, role_name } = await request.json();
  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const adminClient = getAdminSupabase();

  const { data: roleData } = await adminClient
    .from("roles")
    .select("id")
    .eq("name", role_name || "learner")
    .single();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role_id: roleData?.id },
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  if (role_name === "tutor" && authData.user) {
    await adminClient.from("tutors").insert({ user_id: authData.user.id });
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
  const admin = await getAdminUser(supabase);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { user_id, full_name, email, role_name } = await request.json();
  if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

  const adminClient = getAdminSupabase();

  // Update profile name
  if (full_name !== undefined) {
    await adminClient.from("profiles").update({ full_name }).eq("id", user_id);
  }

  // Update email via auth admin
  if (email) {
    const { error } = await adminClient.auth.admin.updateUserById(user_id, { email });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await adminClient.from("profiles").update({ email }).eq("id", user_id);
  }

  // Update role
  if (role_name) {
    const { data: roleData } = await adminClient
      .from("roles")
      .select("id")
      .eq("name", role_name)
      .single();

    if (roleData) {
      await adminClient.from("profiles").update({ role_id: roleData.id }).eq("id", user_id);

      // Create/remove tutor record
      if (role_name === "tutor") {
        await adminClient.from("tutors").upsert({ user_id }, { onConflict: "user_id" });
      } else {
        await adminClient.from("tutors").delete().eq("user_id", user_id);
      }
    }
  }

  // Log action
  await adminClient.from("analytics_logs").insert({
    user_id: admin.id,
    action: "user_edited",
    entity_type: "user",
    entity_id: user_id,
    metadata: { full_name, email, role_name, edited_by: admin.email },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const admin = await getAdminUser(supabase);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { user_id } = await request.json();
  if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

  if (user_id === admin.id) {
    return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 });
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
  await adminClient.from("profiles").delete().eq("id", user_id);
  const { error } = await adminClient.auth.admin.deleteUser(user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
