"use client";

import { useEffect, useState, useCallback } from "react";
import { useInactivityTimeout } from "@/hooks/use-inactivity-timeout";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProvider, useUser } from "@/lib/user-context";
import { MessageToastProvider } from "@/components/messages/message-toast-provider";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, role, loading, notificationCount } = useUser();
  const [messageCount, setMessageCount] = useState(0);

  useInactivityTimeout();

  /** Count unread messages across all conversations */
  const loadMessageCount = useCallback(async () => {
    if (!profile?.id) return;
    const supabase = createClient();
    // Count messages not sent by self that arrived after last_read_at
    const { data } = await supabase
      .from("conversation_participants")
      .select("last_read_at, conversation_id")
      .eq("profile_id", profile.id);

    if (!data) return;

    let unread = 0;
    await Promise.all(
      data.map(async (p) => {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", p.conversation_id)
          .neq("sender_id", profile.id)
          .gt("created_at", p.last_read_at ?? "1970-01-01");
        unread += count ?? 0;
      })
    );
    setMessageCount(unread);
  }, [profile?.id]);

  useEffect(() => {
    loadMessageCount();
  }, [loadMessageCount]);

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
        messageCount={messageCount}
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

      {/* Floating MS Teams-style message notifications */}
      {profile?.id && <MessageToastProvider currentUserId={profile.id} />}
    </SidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </UserProvider>
  );
}
