"use client";

import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";

export function OnboardingTour() {
  const { profile } = useUser();
  const [mounted, setMounted] = useState(false);

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
        if (
          !tour.hasNextStep() ||
          confirm("Are you sure you want to skip the tour?")
        ) {
          localStorage.setItem("hasSeenOnboardingTour", "true");
          tour.destroy();
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

  return null;
}
