"use client";

import DashboardView from "@/app/dashboard/components/dashboard-view";
import { ErrorBoundary } from "@/components/error-boundary";
import { Suspense } from "react";
import { WelcomeCarousel } from "@/features/onboarding/components/welcome-carousel";
import { GlobalAnnouncementBoard } from "@/features/announcements/components/global-announcement-board";

export default function DashboardHomePage() {
  return (
    <ErrorBoundary>
      <Suspense>
        <div className="space-y-6 max-w-7xl mx-auto w-full">
          <h1 className="sr-only">Dashboard Home</h1>
          <WelcomeCarousel />
          <GlobalAnnouncementBoard />
          <DashboardView />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
