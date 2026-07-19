"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";
import { getAvatarUrl } from "@/lib/utils";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
}

export function UserProfileDialog({
  open,
  onOpenChange,
  user,
}: UserProfileDialogProps) {
  if (!user) return null;

  function getInitials(name: string | null | undefined) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getUserRoleName(roles: unknown): string {
    if (Array.isArray(roles) && roles.length > 0) return roles[0].name;
    if (roles && typeof roles === "object" && !Array.isArray(roles))
      // @ts-ignore: Strict unknown type check
      return roles.name;
    return "learner";
  }

  const roleColors: Record<string, string> = {
    super_admin: "bg-red-500/10 text-red-500 border-red-500/30",
    president: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    administrator: "bg-warning/10 text-warning-foreground border-warning/30",
    treasurer: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    auditor: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    finance_manager: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    committee_head: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    faculty_adviser: "bg-pink-500/10 text-pink-500 border-pink-500/30",
    tutor: "bg-primary/10 text-primary border-primary/30",
    learner: "bg-success/10 text-success border-success/30",
  };

  const roleName = getUserRoleName(user.roles);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            Detailed view of user information.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border">
              <AvatarImage src={getAvatarUrl(user.avatar_url)} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold">
                {user.full_name || "Unnamed User"}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div>
                <Badge
                  variant="outline"
                  className={roleColors[roleName] || roleColors.learner}
                >
                  {roleName.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 p-3 border rounded-md">
              <span className="text-xs text-muted-foreground font-medium uppercase">
                Program
              </span>
              <span className="text-sm font-medium">
                {user.degree_program || "Not specified"}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-3 border rounded-md">
              <span className="text-xs text-muted-foreground font-medium uppercase">
                Year Level
              </span>
              <span className="text-sm font-medium">
                {user.year_level || "Not specified"}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-3 border rounded-md">
              <span className="text-xs text-muted-foreground font-medium uppercase">
                Member #
              </span>
              <span className="text-sm font-mono">
                {user.membership_number || "PENDING"}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-3 border rounded-md">
              <span className="text-xs text-muted-foreground font-medium uppercase">
                Joined
              </span>
              <span className="text-sm font-medium">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-3 border rounded-md">
              <span className="text-xs text-muted-foreground font-medium uppercase">
                Total XP
              </span>
              <span className="text-sm font-bold text-amber-500">
                {user.total_xp || 0} XP
              </span>
            </div>
            <div className="flex flex-col gap-1 p-3 border rounded-md">
              <span className="text-xs text-muted-foreground font-medium uppercase">
                Status
              </span>
              <span className="text-sm font-medium">
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {(user as any).is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {user.bio && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Biography</span>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-muted/50 rounded-md">
                {user.bio}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
