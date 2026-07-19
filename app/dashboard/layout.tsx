import { cookies } from "next/headers";
import DashboardClientLayout from "./client-layout";
import { IdleTimeoutProvider } from "@/components/idle-timeout-provider";
import { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed")
    .eq("id", user.id)
    .single();

  if (profile && !profile.profile_completed) {
    redirect("/auth/setup-profile");
  }

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
