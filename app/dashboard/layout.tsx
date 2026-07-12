import { cookies } from "next/headers";
import DashboardClientLayout from "./client-layout";
import { IdleTimeoutProvider } from "@/components/idle-timeout-provider";
import { ReactNode } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarState === "false" ? false : true;

  return (
    <IdleTimeoutProvider>
      <DashboardClientLayout defaultOpen={defaultOpen}>
        {children}
      </DashboardClientLayout>
    </IdleTimeoutProvider>
  );
}
