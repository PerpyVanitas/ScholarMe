/** Dev-only role switcher banner -- sets a dev_role cookie via server action and refreshes. */
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
