"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import type { UserRole } from "@/lib/types";
import { Loader2, ShieldX } from "lucide-react";

interface RoleGateProps {
  /** Roles that ARE allowed to view this page */
  allowedRoles: UserRole[];
  children: React.ReactNode;
  /** Where to redirect if role doesn't match. Defaults to /dashboard/home */
  redirectTo?: string;
}

/**
 * Client-side role gate.
 * Renders children only if the current user's role is in allowedRoles.
 * Otherwise shows a brief "Access Denied" and redirects.
 */
export function RoleGate({ allowedRoles, children, redirectTo = "/dashboard/home" }: RoleGateProps) {
  const { role, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !allowedRoles.includes(role)) {
      router.replace(redirectTo);
    }
  }, [role, loading, allowedRoles, redirectTo, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="rounded-full bg-destructive/10 p-4">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view this page. Redirecting...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
