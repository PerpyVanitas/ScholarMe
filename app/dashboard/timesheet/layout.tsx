import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hasAnyRole, TUTOR_ROLES } from "@/lib/utils/roles";

export default async function TutorLayout({
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
    : ((rawRole as Record<string, unknown> | null)?.name as string | undefined);

  // Gate: Only tutors can access timesheet routes
  if (!hasAnyRole(roleName, TUTOR_ROLES)) {
    redirect("/dashboard/home");
  }

  return <>{children}</>;
}
