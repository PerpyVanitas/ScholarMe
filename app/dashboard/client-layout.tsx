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
import { A11ySettings } from "@/components/a11y-settings";
import { UserProvider, useUser } from "@/lib/user-context";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ThemeApplicator } from "@/components/theme-applicator";
import { ScrollToTop } from "@/components/scroll-to-top";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ScrollToTopFab } from "@/components/scroll-to-top-fab";
import { CommandMenu } from "@/components/command-menu";
import { StreakIndicator } from "@/features/gamification/components/streak-indicator";
import { OnboardingTour } from "@/features/onboarding/components/onboarding-tour";
import { MobileFab } from "@/components/mobile-fab";
import { PageTutorialButton } from "@/components/page-tutorial-button";
import { AnalyticsPageTracker } from "@/components/analytics-page-tracker";
import { GlobalChat } from "@/features/messaging/components/global-chat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function DashboardLayoutContent({
  children,
  defaultOpen,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const { profile, role, loading, notificationCount } = useUser();
  const { showWarning, staySignedIn } = useInactivityTimeout();

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        {/* Sidebar Skeleton */}
        <div className="hidden md:flex w-64 flex-col border-r border-border/60 p-4 gap-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="space-y-2 mt-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-[80%]" />
            <Skeleton className="h-8 w-[90%]" />
          </div>
        </div>
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
            <Skeleton className="h-6 w-32" />
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </header>
          <div className="p-6">
            <Skeleton className="h-8 w-[250px] mb-4" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <ThemeApplicator
        profileThemeColor={profile?.profile_theme_color || undefined}
      />
      <AppSidebar
        profile={profile!}
        role={role}
        notificationCount={notificationCount}
      />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 h-4 hidden md:flex"
          />
          <BreadcrumbNav />
          <div
            id="tour-command-menu"
            className="flex-1 flex justify-center max-w-md mx-auto hidden md:flex"
          >
            <CommandMenu />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div id="tour-streak-indicator">
              <StreakIndicator />
            </div>
            <FeedbackButton />
            <PageTutorialButton />
            <A11ySettings />
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-col gap-6 flex-1 overflow-auto p-4 pb-24 md:pb-6 md:p-6">
          {children}
        </div>
        <ScrollToTop />
        <OnboardingTour />
        <AnalyticsPageTracker />
        <MobileBottomNav />
        <MobileFab />
      </SidebarInset>

      {/* Session Timeout Warning Modal */}
      <Dialog
        open={showWarning}
        onOpenChange={(open) => {
          if (!open) staySignedIn();
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Session Expiring Soon</DialogTitle>
            <DialogDescription>
              You have been inactive for a while. For your security, you will be
              automatically logged out in 60 seconds.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start mt-4">
            <Button type="button" onClick={staySignedIn} className="w-full">
              Keep Me Signed In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <GlobalChat
        currentUserId={profile?.id || ""}
        isAdmin={role === "super_admin" || role === "administrator"}
      />
      <ScrollToTopFab />
    </SidebarProvider>
  );
}

export default function DashboardClientLayout({
  children,
  defaultOpen,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <UserProvider>
      <DashboardLayoutContent defaultOpen={defaultOpen}>
        {children}
      </DashboardLayoutContent>
    </UserProvider>
  );
}
