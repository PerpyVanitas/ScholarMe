"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function LoginInactivityCheck() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && searchParams?.get("reason") === "inactive") {
      toast.info("You were signed out due to inactivity.");
    }
  }, [mounted, searchParams]);

  return null;
}
