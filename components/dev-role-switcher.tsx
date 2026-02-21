/**
 * ==========================================================================
 * DEV ROLE SWITCHER - Development-Only Role Preview
 * ==========================================================================
 *
 * PURPOSE: A banner shown at the top of the dashboard (only in demo mode,
 * when there's no authenticated user) that lets you quickly switch between
 * Learner, Tutor, and Admin roles to preview each dashboard.
 *
 * HOW IT WORKS:
 * 1. User clicks one of the three role buttons
 * 2. Calls the switchDevRole SERVER ACTION which sets a "dev_role" cookie server-side
 * 3. Calls router.refresh() which re-runs all Server Components on the current page
 * 4. The layout and page read the new cookie and render the appropriate role view
 *
 * WHY SERVER ACTION (not client-side cookie):
 * Previously we tried document.cookie + window.location.href but that
 * didn't work in the v0 preview iframe. Server Actions reliably set cookies
 * and router.refresh() forces the server to re-render with the new value.
 *
 * This component is ONLY rendered when isDemoMode is true (no real user).
 * In production with real auth, this would be removed.
 * ==========================================================================
 */
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/types";
import { GraduationCap, BookOpen, Shield, Loader2 } from "lucide-react";
import { switchDevRole } from "@/app/dashboard/actions";

const roles: { value: UserRole; label: string; icon: typeof GraduationCap }[] = [
  { value: "learner", label: "Learner", icon: BookOpen },
  { value: "tutor", label: "Tutor", icon: GraduationCap },
  { value: "administrator", label: "Admin", icon: Shield },
];

export function DevRoleSwitcher({ currentRole }: { currentRole: UserRole }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSwitch(role: UserRole) {
    startTransition(async () => {
      await switchDevRole(role);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
        {isPending ? "Switching role..." : "Dev Mode: Switch role to preview different dashboards"}
      </span>
      <div className="flex gap-2">
        {roles.map((r) => (
          <Button
            key={r.value}
            size="sm"
            variant={currentRole === r.value ? "default" : "outline"}
            className="h-7 gap-1.5 text-xs"
            disabled={isPending}
            onClick={() => handleSwitch(r.value)}
          >
            {isPending && currentRole !== r.value ? null : <r.icon className="h-3 w-3" />}
            {r.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
