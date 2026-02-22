"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useInactivityTimeout } from "@/hooks/use-inactivity-timeout";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UserRole, Profile } from "@/lib/types";
import { DEMO_USERS, getDemoUserFromCookie } from "@/lib/demo";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>("learner");
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useInactivityTimeout();

  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("*, roles(*)")
          .eq("id", user.id)
          .maybeSingle();

        if (p) {
          setProfile(p);
          setRole((p.roles?.name || "learner") as UserRole);
        } else {
          setProfile({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            email: user.email || "",
            avatar_url: null,
            created_at: user.created_at || new Date().toISOString(),
            roles: { id: "fallback", name: "learner" },
          } as Profile);
          setRole("learner");
        }

        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);
        setNotificationCount(count || 0);
      } else {
        const { role: demoRole, userId: demoUserId } = getDemoUserFromCookie("learner");
        const { data: demoProfile } = await supabase
          .from("profiles")
          .select("*, roles(*)")
          .eq("id", demoUserId)
          .maybeSingle();

        if (demoProfile) {
          setProfile(demoProfile);
          setRole((demoProfile.roles?.name || demoRole) as UserRole);
        } else {
          const demoInfo = DEMO_USERS[demoRole as keyof typeof DEMO_USERS] || DEMO_USERS.learner;
          setProfile({
            id: demoInfo.profileId,
            full_name: demoInfo.fullName,
            email: demoInfo.email,
            avatar_url: null,
            created_at: new Date().toISOString(),
            roles: { id: "demo-role", name: demoRole },
          } as Profile);
          setRole(demoRole);
        }
      }

      setLoading(false);
    }

    loadUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar
        profile={profile!}
        role={role}
        notificationCount={notificationCount}
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
