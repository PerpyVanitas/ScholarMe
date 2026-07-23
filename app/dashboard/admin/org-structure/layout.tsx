import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OrgStructureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const roleName = Array.isArray(profile?.roles)
    ? profile.roles[0]?.name
    : ((profile?.roles as unknown as Record<string, unknown> | null)?.name as
        string | undefined);

  if (roleName !== "super_admin") {
    redirect("/dashboard/admin");
  }

  return <>{children}</>;
}
