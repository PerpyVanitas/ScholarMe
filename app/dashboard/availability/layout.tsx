import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (rawRole as any)?.name;

  // Gate: Only tutors can access availability routes
  if (roleName !== "tutor") {
    redirect("/dashboard/home");
  }

  return <>{children}</>;
}
