/**
 * ==========================================================================
 * DASHBOARD LAYOUT - Shared Shell for All Dashboard Pages
 * ==========================================================================
 *
 * PURPOSE: This is a Server Component layout that wraps EVERY page under
 * /dashboard/*. It provides:
 * 1. The sidebar navigation (AppSidebar component)
 * 2. A top header bar with the sidebar toggle button
 * 3. The DevRoleSwitcher (only shown in demo/dev mode)
 * 4. A scrollable content area where child pages render
 *
 * HOW IT DETERMINES THE USER'S ROLE:
 * 1. Try to get the authenticated user from Supabase Auth
 * 2. If user exists: query their profile from the database (includes role)
 * 3. If NO user (demo mode): create a fake profile and read the role from
 *    the "dev_role" cookie (set by the DevRoleSwitcher buttons)
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * - This is a SERVER Component -- it runs on the server for every request
 * - It can read cookies (for dev_role) and query the database directly
 * - Child pages (like /dashboard/page.tsx) also need to determine the role
 *   independently since layouts don't pass props to children in Next.js
 * - The "isDemoMode" flag shows the DevRoleSwitcher only when there's no
 *   real authenticated user
 *
 * ROUTE: /dashboard/* (wraps all dashboard pages)
 * ==========================================================================
 */
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
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (e) {
    console.log("[v0] Layout auth.getUser error:", e);
  }
  const cookieStore = await cookies();
  const devRole = cookieStore.get("dev_role")?.value as UserRole | undefined;

  let profile: any = null;
  let notificationCount = 0;

  if (user) {
    try {
      const { data: p } = await supabase
        .from("profiles")
        .select("*, roles(*)")
        .eq("id", user.id)
        .maybeSingle();
      profile = p;

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      notificationCount = count || 0;
    } catch (error) {
      console.log("[v0] Layout DB query error:", error);
    }
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
