import { createClient } from "@/lib/supabase/server";
import { canAccessAdminRoute, getRoleName } from "@/lib/utils/roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch the logged-in user's profile and role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(name)")
    .eq("id", user.id)
    .single();

  const roleName = getRoleName(profile ?? { roles: [] });
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "/dashboard/admin";

  // Gate each admin area to the constitutional/officer role it maps to.
  if (!canAccessAdminRoute(roleName, pathname)) {
    redirect("/dashboard/home");
  }

  return <>{children}</>;
}
