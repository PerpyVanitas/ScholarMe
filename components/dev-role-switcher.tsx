"use client";

import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/types";
import { GraduationCap, BookOpen, Shield } from "lucide-react";

const roles: { value: UserRole; label: string; icon: typeof GraduationCap }[] = [
  { value: "learner", label: "Learner", icon: BookOpen },
  { value: "tutor", label: "Tutor", icon: GraduationCap },
  { value: "administrator", label: "Admin", icon: Shield },
];

export function DevRoleSwitcher({ currentRole }: { currentRole: UserRole }) {
  function switchRole(role: UserRole) {
    document.cookie = `dev_role=${role};path=/;max-age=86400`;
    // Hard reload so the server layout re-reads the cookie
    window.location.href = "/dashboard";
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
        Dev Mode: Switch role to preview different dashboards
      </span>
      <div className="flex gap-2">
        {roles.map((r) => (
          <Button
            key={r.value}
            size="sm"
            variant={currentRole === r.value ? "default" : "outline"}
            className="h-7 gap-1.5 text-xs"
            onClick={() => switchRole(r.value)}
          >
            <r.icon className="h-3 w-3" />
            {r.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
