"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { analytics } from "@/lib/analytics";

export function AnalyticsPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      analytics.page(pathname);
    }
  }, [pathname]);

  return null;
}
