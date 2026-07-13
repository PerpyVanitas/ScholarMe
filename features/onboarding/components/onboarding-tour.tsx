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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tourInstance, setTourInstance] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !profile) return;

    // Check if they've seen it before
    const hasSeenTour = localStorage.getItem("hasSeenOnboardingTour");
    if (hasSeenTour) return;

    const tour = driver({
      showProgress: true,
      animate: true,
      steps: [
        {
          element: "#tour-command-menu",
          popover: {
            title: "Global Search",
            description:
              "Press Cmd+K or Ctrl+K anywhere to jump between features, study tools, or profile settings instantly.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#tour-streak-indicator",
          popover: {
            title: "Study Streaks",
            description:
              "Log in and complete sessions daily to build your streak and earn more XP!",
            side: "bottom",
            align: "center",
          },
        },
      ],
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

    // Small timeout to let UI mount
    setTimeout(() => {
      try {
        tour.drive();
      } catch (e) {
        console.error("Tour failed to start", e);
        toast.error(e instanceof Error ? e.message : "An error occurred");
      }
    }, 1500);
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
