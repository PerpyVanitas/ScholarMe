"use client";

import DashboardView from "@/components/dashboard/dashboard-view";

/**
 * Error Boundary for /dashboard routes.
 * When the stale SSR chunk crashes, this mounts the real DashboardView
 * client-side, which fetches fresh data from /api/dashboard and renders
 * the correct role-specific dashboard.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardView />;
}
