import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/create-client";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UserRole } from "@/lib/types";
import { DEMO_USERS, getDemoProfileId } from "@/lib/demo";

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
  } catch {
    // Auth unavailable -- continue in demo mode
  }
  console.log("[v0] Layout - user detected:", !!user, "userId:", user?.id, "email:", user?.email);
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
    } catch {
      // DB query failed -- fall through to demo profile
    }
  }

  const isDemoMode = !user;
  console.log("[v0] Layout - isDemoMode:", isDemoMode, "profile:", !!profile, "profileRole:", profile?.roles?.name);
  const selectedRole = (isDemoMode && devRole ? devRole : (profile?.roles?.name || "learner")) as UserRole;

  if (user && !profile) {
    profile = {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      avatar_url: null,
      created_at: user.created_at || new Date().toISOString(),
      roles: { id: "fallback", name: "learner" },
    };
  }

  if (!profile && isDemoMode) {
    const demoProfileId = getDemoProfileId(selectedRole);
    const { data: demoProfile } = await supabase
      .from("profiles")
      .select("*, roles(*)")
      .eq("id", demoProfileId)
      .maybeSingle();

    if (demoProfile) {
      profile = demoProfile;
    } else {
      const demoInfo = DEMO_USERS[selectedRole as keyof typeof DEMO_USERS] || DEMO_USERS.administrator;
      profile = {
        id: demoInfo.profileId,
        full_name: demoInfo.fullName,
        email: demoInfo.email,
        avatar_url: null,
        created_at: new Date().toISOString(),
        roles: { id: "demo-role", name: selectedRole },
      };
    }

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);
    notificationCount = count || 0;
  }

  const role = (isDemoMode && devRole ? devRole : (profile?.roles?.name || "learner")) as UserRole;

  // Guarantee profile is never null for downstream components
  if (!profile) {
    profile = {
      id: user?.id || "unknown",
      full_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
      email: user?.email || "",
      avatar_url: null,
      created_at: new Date().toISOString(),
      roles: { id: "fallback", name: role },
    };
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
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-col gap-6 flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
