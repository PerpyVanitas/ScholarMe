"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function assignRole(
  userId: string,
  roleName: string,
  notes?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Basic admin check (restricted to super_admin)
  const { data: isSuperAdmin } = await supabase.rpc("has_role", {
    user_id: user.id,
    allowed_roles: ["super_admin"],
  });

  if (!isSuperAdmin) {
    return { error: "Only super administrators can assign roles" };
  }

  try {
    // 1. Get role ID
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", roleName)
      .single();

    if (roleError || !roleData) {
      return { error: `Role '${roleName}' not found` };
    }

    // 2. Update profiles.role_id
    const { error: assignError } = await supabase
      .from("profiles")
      .update({ role_id: roleData.id })
      .eq("id", userId);

    if (assignError) {
      return { error: assignError.message };
    }

    // 3. Create audit log entry
    await supabase.from("analytics_logs").insert({
      user_id: userId,
      action: "role_updated",
      entity_type: "role",
      entity_id: roleData.id,
      metadata: { new_role: roleName, assigned_by: user.id, notes },
    });

    revalidatePath("/dashboard/admin/roles");
    return { success: true };
  } catch (error: unknown) {
    console.error("Assign role error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : String(error) || "Failed to assign role",
    };
  }
}

export async function getRoleHistory(userId: string) {
  const supabase = await createClient();

  // We look in analytics_logs for role_updated actions
  const { data, error } = await supabase
    .from("analytics_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("action", "role_updated")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      logs: [],
    };
  }

  return { logs: data || [] };
}
