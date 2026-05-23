import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { getRoleName } from "@/lib/utils/roles";
import { createAdminClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

async function validateAndroidAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  const authSupabase = createSupabaseForBearer(token);
  const { data: { user } } = await authSupabase.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await authSupabase.from("profiles").select("*, roles(name)").eq("id", user.id).single();
  if (getRoleName(profile) !== "administrator") return null;
  return { user, profile };
}

export async function GET(request: Request) {
  try {
    const admin = await validateAndroidAdmin(request);
    if (!admin) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });

    const supabase = await createAdminClient();
    
    // Fetch real users from the profiles table
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, roles(name), is_card_issued, unique_id_number")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ success: false, message: "Database error" }, { status: 500 });
    }


    // Ensure roles is an array of { id, name }
    const formattedUsers = users.map(u => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      avatarUrl: u.avatar_url,
      roles: Array.isArray(u.roles)
        ? u.roles.map((r: any) => ({
            id: r.id ?? "",
            name: r.name ?? ""
          }))
        : u.roles
        ? [{ id: u.roles.id ?? "", name: u.roles.name ?? "" }]
        : [],
      isCardIssued: u.is_card_issued || false,
      uniqueIdNumber: u.unique_id_number || ""
    }));

    return NextResponse.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error("[Android Admin API] Fetch users error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await validateAndroidAdmin(request);
    if (!admin) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });

    const { email, password, full_name, role_name } = await request.json();
    if (!email || !password || !full_name) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data: roleData } = await supabase.from("roles").select("id").eq("name", role_name || "learner").single();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role_id: roleData?.id },
    });

    if (authError) return NextResponse.json({ success: false, message: authError.message }, { status: 500 });

    if (role_name === "tutor" && authData.user) {
      await supabase.from("tutors").insert({ user_id: authData.user.id });
    }

    await supabase.from("analytics_logs").insert({
      user_id: admin.user.id,
      action: "user_created",
      entity_type: "user",
      entity_id: authData.user?.id,
      metadata: { email, role_name, created_by: admin.user.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Android Admin API] Create user error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await validateAndroidAdmin(request);
    if (!admin) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });

    const { user_id, full_name, email, role_name, password } = await request.json();
    if (!user_id) return NextResponse.json({ success: false, message: "Missing user_id" }, { status: 400 });

    const supabase = await createAdminClient();

    if (full_name !== undefined) {
      await supabase.from("profiles").update({ full_name }).eq("id", user_id);
    }

    if (email) {
      const { error } = await supabase.auth.admin.updateUserById(user_id, { email });
      if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      await supabase.from("profiles").update({ email }).eq("id", user_id);
    }

    if (password) {
      const { error } = await supabase.auth.admin.updateUserById(user_id, { password });
      if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    if (role_name) {
      const { data: roleData } = await supabase.from("roles").select("id").eq("name", role_name).single();
      if (roleData) {
        await supabase.from("profiles").update({ role_id: roleData.id }).eq("id", user_id);
        if (role_name === "tutor") {
          await supabase.from("tutors").upsert({ user_id }, { onConflict: "user_id" });
        } else {
          await supabase.from("tutors").delete().eq("user_id", user_id);
        }
      }
    }

    await supabase.from("analytics_logs").insert({
      user_id: admin.user.id,
      action: "user_edited",
      entity_type: "user",
      entity_id: user_id,
      metadata: { full_name, email, role_name, password_changed: !!password, edited_by: admin.user.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Android Admin API] Edit user error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await validateAndroidAdmin(request);
    if (!admin) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });

    const { user_id } = await request.json();
    if (!user_id) return NextResponse.json({ success: false, message: "Missing user_id" }, { status: 400 });

    if (user_id === admin.user.id) {
      return NextResponse.json({ success: false, message: "Cannot delete your own admin account" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user_id).single();

    await supabase.from("analytics_logs").insert({
      user_id: admin.user.id,
      action: "user_deleted",
      entity_type: "user",
      entity_id: user_id,
      metadata: { deleted_email: profile?.email, deleted_name: profile?.full_name, deleted_by: admin.user.email },
    });

    await supabase.from("profiles").delete().eq("id", user_id);
    const { error } = await supabase.auth.admin.deleteUser(user_id);

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Android Admin API] Delete user error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
