"use client";

import DashboardView from "@/app/dashboard/components/dashboard-view";
import { ErrorBoundary } from "@/components/error-boundary";
import { Suspense, useState, useEffect } from "react";
import { WelcomeCarousel } from "@/features/onboarding/components/welcome-carousel";
import { GlobalAnnouncementBoard } from "@/features/announcements/components/global-announcement-board";
import { MilestoneNotifier } from "@/components/milestone-notifier";
import { PlcLiveDeskWidget } from "@/components/plc-live-desk-widget";
import { MiniEventCalendar } from "@/features/events/components/mini-event-calendar";
import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";

export default function DashboardHomePage() {
  const { profile } = useUser();
  const [digestText, setDigestText] = useState<string | null>(null);

  // Compute the weekly digest subtitle inline (replaces WeeklyDigestBanner card)
  useEffect(() => {
    if (!profile) return;
    async function compute() {
      try {
        const supabase = createClient();
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const isoStart = startOfWeek.toISOString();

        const { data: sessions } = await supabase
          .from("sessions")
          .select("id")
          .or(`tutor_id.eq.${profile!.id},learner_id.eq.${profile!.id}`)
          .eq("status", "completed")
          .gte("scheduled_date", isoStart.split("T")[0]);

        const { data: xpLogs } = await supabase
          .from("xp_events")
          .select("amount")
          .eq("user_id", profile!.id)
          .gte("created_at", isoStart);

        const weeklyXp = xpLogs?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const sessionCount = sessions?.length || 0;

        if (sessionCount === 0 && weeklyXp === 0) {
          setDigestText("Ready to jump into your next session or flashcard practice?");
        } else {
          setDigestText(
            `This week: ${sessionCount} session${sessionCount !== 1 ? "s" : ""} completed · ${weeklyXp} XP earned`
          );
        }
      } catch {
        // silently ignore
      }
    }
    compute();
  }, [profile]);

  return (
    <ErrorBoundary>
      <Suspense>
        <div className="space-y-6 max-w-7xl mx-auto w-full">
          <h1 className="sr-only">Dashboard Home</h1>

          {/* ① Welcome heading — always first */}
          {profile && (
            <div className="flex flex-col gap-0.5">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Welcome back, {profile.first_name || profile.full_name || "Scholar"}
              </h2>
              {digestText && (
                <p className="text-sm text-muted-foreground">{digestText}</p>
              )}
            </div>
          )}

          {/* Milestone popups */}
          {profile && <MilestoneNotifier profile={profile} />}

          {/* ② PLC Live Desk — stays immediately visible */}
          <PlcLiveDeskWidget />

          {/* ③ Announcements */}
          <GlobalAnnouncementBoard />

          {/* ④ Calendar — not resized */}
          <MiniEventCalendar />

          {/* Welcome onboarding carousel (only shown for new users) */}
          <WelcomeCarousel />

          {/* ⑤ Role-specific dashboard content */}
          <DashboardView />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
