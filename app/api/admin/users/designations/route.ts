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
  return user;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const supabase = await createClient();
  const admin = await getAdminUser(supabase);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const adminClient = getAdminSupabase();

  const { data, error } = await adminClient
    .from("hs_designations")
    .select(
      "id, user_id, designation, position, academic_year, is_current, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ designations: data }, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = await getAdminUser(supabase);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { user_id, designation, position, academic_year, is_current } =
    await request.json();

  if (!user_id || !designation || !academic_year) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const adminClient = getAdminSupabase();

  // If new designation is current, set others to not current
  if (is_current) {
    await adminClient
      .from("hs_designations")
      .update({ is_current: false })
      .eq("user_id", user_id);
  }

  const { data, error } = await adminClient
    .from("hs_designations")
    .insert({
      user_id,
      designation,
      position: designation === "officer" ? position : null,
      academic_year,
      is_current,
    })
    .select(
      "id, user_id, designation, position, academic_year, is_current, created_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log action
  await adminClient.from("analytics_logs").insert({
    user_id: admin.id,
    action: "user_edited",
    entity_type: "user",
    entity_id: user_id,
    metadata: {
      action_detail: "added_designation",
      designation_id: data.id,
      designation,
      edited_by: admin.email,
    },
  });

  return NextResponse.json({ designation: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const admin = await getAdminUser(supabase);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const {
    designation_id,
    user_id,
    designation,
    position,
    academic_year,
    is_current,
  } = await request.json();

  if (!designation_id || !user_id) {
    return NextResponse.json(
      { error: "Missing designation_id or user_id" },
      { status: 400 },
    );
  }

  const adminClient = getAdminSupabase();

  // If this designation is current, set others to not current
  if (is_current) {
    await adminClient
      .from("hs_designations")
      .update({ is_current: false })
      .eq("user_id", user_id);
  }

  const { data, error } = await adminClient
    .from("hs_designations")
    .update({
      designation,
      position: designation === "officer" ? position : null,
      academic_year,
      is_current,
    })
    .eq("id", designation_id)
    .select(
      "id, user_id, designation, position, academic_year, is_current, created_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log action
  await adminClient.from("analytics_logs").insert({
    user_id: admin.id,
    action: "user_edited",
    entity_type: "user",
    entity_id: user_id,
    metadata: {
      action_detail: "updated_designation",
      designation_id,
      designation,
      edited_by: admin.email,
    },
  });

  return NextResponse.json({ designation: data }, { status: 200 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const admin = await getAdminUser(supabase);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { designation_id, user_id } = await request.json();

  if (!designation_id || !user_id) {
    return NextResponse.json(
      { error: "Missing designation_id or user_id" },
      { status: 400 },
    );
  }

  const adminClient = getAdminSupabase();

  const { error } = await adminClient
    .from("hs_designations")
    .delete()
    .eq("id", designation_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log action
  await adminClient.from("analytics_logs").insert({
    user_id: admin.id,
    action: "user_edited",
    entity_type: "user",
    entity_id: user_id,
    metadata: {
      action_detail: "deleted_designation",
      designation_id,
      edited_by: admin.email,
    },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
