import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OrgStructureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/auth/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", session.user.id)
    .single();

  const roleName = Array.isArray(profile?.roles)
    ? (profile.roles as any[])[0]?.name
    : (profile?.roles as any)?.name;

  if (roleName !== "super_admin") {
    redirect("/dashboard/admin");
  }

  return <>{children}</>;
}
