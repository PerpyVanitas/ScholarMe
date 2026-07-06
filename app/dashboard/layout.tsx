"use client";

import { useInactivityTimeout } from "@/hooks/use-inactivity-timeout";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { FeedbackButton } from "@/components/feedback-button";
import { UserProvider, useUser } from "@/lib/user-context";
import { Loader2 } from "lucide-react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ScrollToTop } from "@/components/scroll-to-top";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, role, loading, notificationCount } = useUser();

  useInactivityTimeout();

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
          <SidebarTrigger className="-ml-1 hidden md:flex" />
          <Separator
            orientation="vertical"
            className="mr-2 h-4 hidden md:flex"
          />
          <BreadcrumbNav />
          <div className="ml-auto flex items-center gap-2">
            <FeedbackButton />
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-col gap-6 flex-1 overflow-auto p-4 pb-24 md:pb-6 md:p-6">
          {children}
        </div>
        <ScrollToTop />
        <MobileBottomNav />
      </SidebarInset>
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
