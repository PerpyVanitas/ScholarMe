"use client";

import { useInactivityTimeout } from "@/hooks/use-inactivity-timeout";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProvider, useUser } from "@/lib/user-context";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

// Derive a human-readable page title from the current URL path
function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return "Dashboard";
  const last = segments[segments.length - 1];
  // Handle dynamic segments like [id]
  if (last.length === 36 && last.includes("-")) return "Details";
  const titleMap: Record<string, string> = {
    home: "Dashboard",
    sessions: "Sessions",
    tutors: "Find Tutors",
    resources: "Resources",
    quizzes: "Study Quizzes",
    notifications: "Notifications",
    profile: "Profile",
    leaderboard: "Leaderboard",
    messages: "Messages",
    voting: "Voting",
    timesheet: "Timesheet",
    availability: "Availability",
    users: "User Management",
    cards: "Auth Cards",
    timesheets: "Timesheets",
    analytics: "Analytics",
    study: "Study Session",
  };
  return titleMap[last] ?? last.charAt(0).toUpperCase() + last.slice(1);
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, role, loading, notificationCount } = useUser();
  const pathname = usePathname();

  useInactivityTimeout();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pageTitle = getPageTitle(pathname);

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
          <span className="text-sm font-medium text-foreground">{pageTitle}</span>
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
