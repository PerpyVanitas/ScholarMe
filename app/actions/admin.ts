"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/lib/types";

export async function getUsers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if admin
  const { data: isAdmin } = await supabase.rpc("has_role", {
    user_id: user.id,
    allowed_roles: ["administrator"],
  });
  if (!isAdmin) throw new Error("Unauthorized");

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, roles(name)");

  if (error) throw new Error(error.message);
  return users;
}

export async function assignFinanceManager(userId: string, assign: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: isAdmin } = await supabase.rpc("has_role", {
    user_id: user.id,
    allowed_roles: ["administrator"],
  });
  if (!isAdmin) throw new Error("Unauthorized");

  if (assign) {
    const { data: roleData } = await supabase.from("roles").select("id").eq("name", "finance_manager").single();
    if (!roleData) throw new Error("Role not found");

    // Assign to profiles.role_id (this overrides their primary role for now)
    // Or we should update the logic if multiple roles are supported via a join table.
    // Based on types.ts, Profile has `role_id` which links to a single role. 
    // We update role_id
    const { error } = await supabase.from("profiles").update({ role_id: roleData.id }).eq("id", userId);
    if (error) throw new Error(error.message);
  } else {
    // Revert to learner
    const { data: roleData } = await supabase.from("roles").select("id").eq("name", "learner").single();
    if (!roleData) return;
    const { error } = await supabase.from("profiles").update({ role_id: roleData.id }).eq("id", userId);
    if (error) throw new Error(error.message);
  }
  
  revalidatePath("/dashboard/admin/roles");
}
