import { createClient } from "@/lib/supabase/create-client";

/**
 * Verifies if the currently authenticated user has the 'administrator' role.
 * Throws an error or returns null if not authorized.
 */
export async function validateAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const isAdmin = Array.isArray(profile?.roles) 
    ? profile.roles.some((role: any) => role.name === "administrator")
    : (profile?.roles as any)?.name === "administrator";

  return { user, isAdmin };
}
