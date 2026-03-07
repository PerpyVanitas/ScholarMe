"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function LoginInactivityCheck() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("reason") === "inactive") {
      toast.info("You were signed out due to inactivity.");
    }
  }, [searchParams]);

  return null;
}
