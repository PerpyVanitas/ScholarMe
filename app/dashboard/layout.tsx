import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { DevRoleSwitcher } from "@/components/dev-role-switcher";
import type { UserRole } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const devRole = cookieStore.get("dev_role")?.value as UserRole | undefined;

  let profile: any = null;
  let notificationCount = 0;

  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("*, roles(*)")
      .eq("id", user.id)
      .single();
    profile = p;

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    notificationCount = count || 0;
  }

  // Demo profile for bypassing auth during development
  if (!profile) {
    profile = {
      id: "demo",
      full_name: "Demo User",
      email: "demo@scholarme.org",
      avatar_url: null,
      created_at: new Date().toISOString(),
      roles: { id: "demo-role", name: "administrator" },
    };
  }

  // Allow dev role override via cookie (demo mode)
  const isDemoMode = !user;
  const role = (isDemoMode && devRole ? devRole : (profile.roles?.name || "learner")) as UserRole;

  // Override demo profile name based on role
  if (isDemoMode) {
    const demoNames: Record<string, string> = {
      learner: "Learner Demo",
      tutor: "Tutor Demo",
      administrator: "Admin Demo",
    };
    profile.full_name = demoNames[role] || "Demo User";
    profile.roles = { id: "demo-role", name: role };
  }

  return (
    <SidebarProvider>
      <AppSidebar
        profile={profile}
        role={role}
        notificationCount={notificationCount || 0}
      />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <div className="flex flex-col gap-4 flex-1 overflow-auto p-4 md:p-6">
          {isDemoMode && <DevRoleSwitcher currentRole={role} />}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
