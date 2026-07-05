import { createClient } from "@/lib/supabase/server";
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

  const rawRole = profile?.roles;
  const roleName = Array.isArray(rawRole)
    ? rawRole[0]?.name
    : (rawRole as any)?.name;

  // Gate: Only permitted roles can access routes within /dashboard/admin
  if (!["administrator", "super_admin"].includes(roleName)) {
    redirect("/dashboard/home");
  }

  return <>{children}</>;
}
