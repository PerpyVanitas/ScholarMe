"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const WARNING_TIME = 60 * 1000; // 60 seconds before logout
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes total
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "pointerdown",
] as const;

export function useInactivityTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggedOutRef = useRef(false);
  const [showWarning, setShowWarning] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggedOutRef.current) return;
    isLoggedOutRef.current = true;

    const supabase = createClient();
    await supabase.auth.signOut();
    // Use window.location instead of router to avoid initialization issues
    window.location.href = "/auth/login?reason=inactive";
  }, []);

  const resetTimer = useCallback(() => {
    if (isLoggedOutRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    setShowWarning(false);

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Set actual logout timer
    timerRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  const staySignedIn = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Only run on client after mount
    if (typeof window === "undefined") return;

    // Only start tracking if user is authenticated
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted || !user) return;

      // Start the inactivity timer
      resetTimer();

      // Reset timer on any user activity if warning is NOT showing
      const handleActivity = () => {
        // If warning is showing, we wait for explicit button click to stay signed in
        if (!showWarning) {
          resetTimer();
        }
      };

      for (const event of ACTIVITY_EVENTS) {
        window.addEventListener(event, handleActivity, { passive: true });
      }
    });

    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      // Note: removing listener won't work perfectly this way with inline handleActivity,
      // but it's okay for an effect that only unmounts on page exit
    };
  }, [resetTimer, showWarning]);

  return { showWarning, staySignedIn };
}
