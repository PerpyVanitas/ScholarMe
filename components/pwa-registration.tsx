"use client";

import { toast } from "sonner";
import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.error("Service Worker registration failed: ", err);
          toast.error(err instanceof Error ? err.message : "An error occurred");
        });
      });
    }
  }, []);

  return null;
}
