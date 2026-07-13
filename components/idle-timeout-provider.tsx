"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const WARNING_MS = 9 * 60 * 1000; // 9 minutes
const STORAGE_KEY = "scholarme_last_active";
const CHECK_INTERVAL_MS = 10000; // 10 seconds
const THROTTLE_MS = 10000; // Only write to localStorage every 10 seconds max

export function IdleTimeoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const lastWriteRef = useRef<number>(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleActivity = useCallback(() => {
    // If the warning is showing, don't automatically reset activity.
    // They must explicitly click "Stay Logged In" to clear the warning.
    if (showWarning) return;

    const now = Date.now();
    // Throttle writes to localStorage to prevent performance issues
    if (now - lastWriteRef.current > THROTTLE_MS) {
      localStorage.setItem(STORAGE_KEY, now.toString());
      lastWriteRef.current = now;
    }
  }, [showWarning]);

  const checkIdleTime = useCallback(async () => {
    const storedTime = localStorage.getItem(STORAGE_KEY);
    if (!storedTime) return;

    const lastActive = parseInt(storedTime, 10);
    const now = Date.now();
    const diff = now - lastActive;

    if (diff > TIMEOUT_MS) {
      // Time exceeded, sign out
      setIsLoggingOut(true);
      localStorage.removeItem(STORAGE_KEY);
      await supabase.auth.signOut();
      router.push("/auth/login?reason=inactive");
    } else if (diff > WARNING_MS) {
      setShowWarning(true);
    }
  }, [router, supabase]);

  useEffect(() => {
    // Set initial activity
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, now.toString());
    lastWriteRef.current = now;

    // Attach listeners
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start checking interval
    const intervalId = setInterval(checkIdleTime, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, [handleActivity, checkIdleTime]);

  const handleStayLoggedIn = () => {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, now.toString());
    lastWriteRef.current = now;
    setShowWarning(false);
  };

  return (
    <>
      {children}
      <AlertDialog open={showWarning && !isLoggingOut}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you still there?</AlertDialogTitle>
            <AlertDialogDescription>
              Your session is about to expire due to inactivity. You will be
              logged out in less than a minute.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleStayLoggedIn}>
              Stay Logged In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isLoggingOut}>
        <AlertDialogContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <AlertDialogTitle>Signing you out...</AlertDialogTitle>
          <AlertDialogDescription>
            Your session has expired due to inactivity.
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
