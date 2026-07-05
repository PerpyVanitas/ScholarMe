import { createClient } from "@/lib/supabase/create-client";

/**
 * Verifies if the currently authenticated user has the 'administrator' role.
 * Throws an error or returns null if not authorized.
 */
export async function validateAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const isAdmin = Array.isArray(profile?.roles)
    ? profile.roles.some(
        (role: { name: string }) =>
          role.name === "administrator" ||
          role.name === "president" ||
          role.name === "super_admin",
      )
    : ["administrator", "president", "super_admin"].includes(
        (profile?.roles as { name: string } | undefined)?.name || "",
      );

  return { user, isAdmin };
}

import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";

export async function validateAndroidAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, isAdmin: false };
  }
  const token = authHeader.substring(7);
  const authSupabase = createSupabaseForBearer(token);
  const {
    data: { user },
    error: userError,
  } = await authSupabase.auth.getUser(token);

  if (userError || !user) return { user: null, isAdmin: false };

  const { data: profile } = await authSupabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const isAdmin = Array.isArray(profile?.roles)
    ? profile.roles.some(
        (role: { name: string }) =>
          role.name === "administrator" ||
          role.name === "admin" ||
          role.name === "president" ||
          role.name === "super_admin",
      )
    : ["administrator", "admin", "president", "super_admin"].includes(
        (profile?.roles as { name: string } | undefined)?.name || "",
      );

  return { user, isAdmin };
}
