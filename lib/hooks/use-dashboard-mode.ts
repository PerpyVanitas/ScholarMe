/**
 * useDashboardMode
 *
 * Manages which dashboard "lens" a dual-role (tutor) user is viewing.
 * Persists the choice to localStorage so it survives page refreshes.
 *
 * - Tutor-role users can switch between "tutor" and "learner" views.
 * - All other roles are always fixed to "learner" and cannot switch.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserRole } from "@/lib/types";

export type DashboardViewMode = "tutor" | "learner";

const STORAGE_KEY = "scholarme_dashboard_mode";

interface UseDashboardModeResult {
  viewMode: DashboardViewMode;
  setViewMode: (mode: DashboardViewMode) => void;
  canSwitch: boolean; // true only for tutor-role users
}

export function useDashboardMode(role: UserRole): UseDashboardModeResult {
  const canSwitch = role === "tutor";

  // Default: tutors start in tutor view; everyone else is always learner
  const getInitialMode = (): DashboardViewMode => {
    if (!canSwitch) return "learner";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "tutor" || stored === "learner") return stored;
    } catch {
      // localStorage unavailable (SSR or private browsing)
    }
    return "tutor";
  };

  const [viewMode, setViewModeState] =
    useState<DashboardViewMode>(getInitialMode);

  // Re-sync if role changes (e.g. after profile update)
  useEffect(() => {
    if (!canSwitch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewModeState("learner");
    }
  }, [canSwitch]);

  const setViewMode = useCallback(
    (mode: DashboardViewMode) => {
      if (!canSwitch) return;
      setViewModeState(mode);
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // ignore
      }
    },
    [canSwitch],
  );

  return { viewMode, setViewMode, canSwitch };
}
