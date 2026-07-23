"use client";

import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function OnboardingTour() {
  const { profile } = useUser();
  const [mounted, setMounted] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [tourInstance, setTourInstance] = useState<unknown>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !profile) return;

    const handleStartTour = () => {
      const tourElements = document.querySelectorAll("[data-tour-step]");
      let steps = [];

      if (tourElements.length > 0) {
        steps = Array.from(tourElements)
          .sort(
            (a, b) =>
              Number(a.getAttribute("data-tour-step")) -
              Number(b.getAttribute("data-tour-step")),
          )
          .map((el) => ({
            element: el,
            popover: {
              title: el.getAttribute("data-tour-title") || "Info",
              description: el.getAttribute("data-tour-description") || "",
              side: (el.getAttribute("data-tour-side") as "top" | "bottom" | "left" | "right") || "bottom",
              align: (el.getAttribute("data-tour-align") as "start" | "center" | "end") || "start",
            },
          }));
      } else {
        // Fallback to global steps
        steps = [
          {
            element: "#tour-command-menu",
            popover: {
              title: "Global Search",
              description:
                "Press Cmd+K or Ctrl+K anywhere to jump between features, study tools, or profile settings instantly.",
              side: "bottom" as const,
              align: "start" as const,
            },
          },
          {
            element: "#tour-streak-indicator",
            popover: {
              title: "Study Streaks",
              description:
                "Log in and complete sessions daily to build your streak and earn more XP!",
              side: "bottom" as const,
              align: "center" as const,
            },
          },
        ];
      }

      const tour = driver({
        showProgress: true,
        animate: true,
        steps,
        onDestroyStarted: () => {
          if (!tour.hasNextStep()) {
            localStorage.setItem("hasSeenOnboardingTour", "true");
            tour.destroy();
          } else {
            setTourInstance(tour);
            setShowSkipConfirm(true);
          }
        },
      });

      tour.drive();
    };

    // Auto-run logic
    const hasSeenTour = localStorage.getItem("hasSeenOnboardingTour");
    if (!hasSeenTour) {
      setTimeout(() => {
        try {
          handleStartTour();
        } catch (e) {
          console.error("Tour failed to start", e);
        }
      }, 1500);
    } else {
      // 4.13 Contextual Feature Resurfacing
      setTimeout(() => {
        try {
          const seenTipsRaw = localStorage.getItem("scholarme_seen_tips");
          const seenTips: string[] = seenTipsRaw ? JSON.parse(seenTipsRaw) : [];

          // Calculate account age in days
          const accountAgeDays = profile.created_at ? (new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 3600 * 24) : 0;
          
          const tipsConfig = [
            {
              id: "tip_mentorship_matching",
              condition: () => accountAgeDays > 30 && !!document.getElementById("tour-nav-mentorship"),
              element: "#tour-nav-mentorship",
              title: "Did you know?",
              description: "Now that you've been here a while, you can get paired with an experienced member through Mentorship Matching!",
            },
            {
              id: "tip_institutional_wiki",
              condition: () => !!document.getElementById("tour-nav-wiki"),
              element: "#tour-nav-wiki",
              title: "Find SOPs Instantly",
              description: "Looking for organization rules or guidelines? The new Institutional Wiki uses AI to answer questions directly from the rulebook.",
            }
          ];

          const tipToRun = tipsConfig.find(t => !seenTips.includes(t.id) && t.condition());

          if (tipToRun) {
            const tipTour = driver({
              showProgress: false,
              animate: true,
              steps: [
                {
                  element: tipToRun.element,
                  popover: {
                    title: tipToRun.title,
                    description: tipToRun.description,
                    side: "right",
                    align: "center",
                  }
                }
              ],
              onDestroyStarted: () => {
                const newSeen = [...seenTips, tipToRun.id];
                localStorage.setItem("scholarme_seen_tips", JSON.stringify(newSeen));
                tipTour.destroy();
              }
            });
            tipTour.drive();
          }
        } catch (e) {
          console.error("Contextual tip failed to start", e);
        }
      }, 2000);
    }

    // Listen to custom event for manual trigger
    const listener = () => handleStartTour();
    window.addEventListener("start-page-tour", listener);
    return () => window.removeEventListener("start-page-tour", listener);
  }, [mounted, profile]);

  if (!mounted) return null;

  return (
    <AlertDialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Skip Tour?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to skip the onboarding tour? You can always
            find help in the documentation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowSkipConfirm(false)}>
            Continue Tour
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              localStorage.setItem("hasSeenOnboardingTour", "true");
              // @ts-expect-error: Strict unknown type check
              tourInstance?.destroy();
              setShowSkipConfirm(false);
            }}
          >
            Skip
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
