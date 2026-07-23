"use client";

import DashboardView from "@/app/dashboard/components/dashboard-view";
import { ErrorBoundary } from "@/components/error-boundary";
import { Suspense } from "react";
import { WelcomeCarousel } from "@/features/onboarding/components/welcome-carousel";
import { GlobalAnnouncementBoard } from "@/features/announcements/components/global-announcement-board";
import { WeeklyDigestBanner } from "@/components/weekly-digest-banner";
import { MilestoneNotifier } from "@/components/milestone-notifier";
import { PlcLiveDeskWidget } from "@/components/plc-live-desk-widget";
import { useUser } from "@/lib/user-context";

export default function DashboardHomePage() {
  const { profile } = useUser();

  return (
    <ErrorBoundary>
      <Suspense>
        <div className="space-y-6 max-w-7xl mx-auto w-full">
          <h1 className="sr-only">Dashboard Home</h1>
          {profile && <MilestoneNotifier profile={profile} />}
          {profile && <WeeklyDigestBanner profile={profile} />}
          <PlcLiveDeskWidget />
          <WelcomeCarousel />
          <GlobalAnnouncementBoard />
          <DashboardView />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
