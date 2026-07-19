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
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // @ts-ignore: Strict unknown type check
      (profile.roles as unknown[])[0]?.name
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profile?.roles as any)?.name;

  if (roleName !== "super_admin") {
    redirect("/dashboard/admin");
  }

  return <>{children}</>;
}
