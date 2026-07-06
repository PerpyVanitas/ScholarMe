"use client";

import DashboardView from "@/components/dashboard/dashboard-view";
import { ErrorBoundary } from "@/components/error-boundary";
import { Suspense } from "react";
import { WelcomeCarousel } from "@/features/onboarding/components/welcome-carousel";

export default function DashboardHomePage() {
  return (
    <ErrorBoundary>
      <Suspense>
        <WelcomeCarousel />
        <DashboardView />
      </Suspense>
    </ErrorBoundary>
  );
}
