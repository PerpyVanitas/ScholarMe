"use client"

import DashboardView from "@/components/dashboard/dashboard-view"
import { ErrorBoundary } from "@/components/error-boundary"

export default function DashboardHomePage() {
  return (
    <ErrorBoundary>
      <DashboardView />
    </ErrorBoundary>
  )
}
