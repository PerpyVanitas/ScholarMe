import dynamic from "next/dynamic"

const DashboardView = dynamic(
  () => import("@/components/dashboard/dashboard-view"),
  { ssr: false }
)

export default function DashboardPage() {
  return <DashboardView />
}
