"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  User,
  LayoutDashboard,
  BookOpen,
  Lightbulb,
  FolderOpen,
  Users,
  ShieldAlert,
  Search,
  Loader2,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import {
  canAccessFinance,
  GOVERNANCE_ROLES,
  TEAMWORK_ROLES,
  hasAnyRole,
} from "@/lib/utils/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAvatarUrl } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

type SearchUser = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email?: string;
  degree_program?: string | null;
  year_level?: string | null;
  membership_number?: string | null;
  total_xp?: number | null;
  created_at?: string;
  roles?: unknown;
  bio?: string | null;
};

const ROLE_COLORS: Record<string, string> = {
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

function getRoleName(roles: unknown): string {
  if (Array.isArray(roles) && roles.length > 0) return roles[0].name ?? "learner";
  if (roles && typeof roles === "object" && !Array.isArray(roles))
    return (roles as Record<string, string>).name ?? "learner";
  return "learner";
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { role } = useUser();
  const showFinance = canAccessFinance(role);
  const showAdmin = hasAnyRole(role, GOVERNANCE_ROLES);
  const showTeam = hasAnyRole(role, TEAMWORK_ROLES);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [users, setUsers] = React.useState<SearchUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = React.useState(false);
  const showEmpty = !isSearchingUsers && searchQuery.trim().length >= 2 && users.length === 0;

  // Profile quick-view modal
  const [profileUser, setProfileUser] = React.useState<SearchUser | null>(null);
  const [profileOpen, setProfileOpen] = React.useState(false);

  // Block confirmation dialog
  const [blockTarget, setBlockTarget] = React.useState<SearchUser | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = React.useState(false);
  const [isBlocking, setIsBlocking] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounced search via API route (role-filtered + block-aware server-side)
  React.useEffect(() => {
    if (!open || searchQuery.trim().length < 2) {
      setUsers([]);
      return;
    }

    const controller = new AbortController();

    const fetchUsers = async () => {
      setIsSearchingUsers(true);
      try {
        const res = await fetch(
          `/api/v1/users/search?q=${encodeURIComponent(searchQuery.trim())}`,
          { signal: controller.signal },
        );
        if (res.ok) {
          const data = await res.json();
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("[CommandMenu] Search error:", err);
        }
      } finally {
        setIsSearchingUsers(false);
      }
    };

    // 300ms debounce — well within the 500ms SLA
    const timer = setTimeout(fetchUsers, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, open]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  function openProfile(user: SearchUser) {
    setOpen(false);
    setProfileUser(user);
    setProfileOpen(true);
  }

  function initiateBlock(user: SearchUser) {
    setBlockTarget(user);
    setBlockDialogOpen(true);
  }

  async function confirmBlock() {
    if (!blockTarget) return;
    setIsBlocking(true);
    try {
      const res = await fetch("/api/v1/users/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked_id: blockTarget.id }),
      });
      if (res.ok) {
        toast.success(`${blockTarget.full_name} has been blocked.`);
        setProfileOpen(false);
        setBlockDialogOpen(false);
        // Remove them from search results immediately
        setUsers((prev) => prev.filter((u) => u.id !== blockTarget.id));
      } else {
        toast.error("Failed to block user. Please try again.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsBlocking(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground px-4 py-2 relative h-8 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline-flex">Search ScholarMe...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type a command or search users..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {isSearchingUsers && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching users...
            </div>
          )}
          {showEmpty && <CommandEmpty>No results found.</CommandEmpty>}

          {users.length > 0 && (
            <>
              <CommandGroup heading="Users">
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => openProfile(user)}
                    className="flex items-center gap-2"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getAvatarUrl(user.avatar_url)} />
                      <AvatarFallback className="text-xs">
                        {user.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1">{user.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {getRoleName(user.roles).replace(/_/g, " ")}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/home"))}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/tutors"))}
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Find a Tutor</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/resources"))}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Resource Library</span>
            </CommandItem>
            {showFinance && (
              <CommandItem
                onSelect={() => runCommand(() => router.push("/dashboard/finance"))}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Finance</span>
              </CommandItem>
            )}
          </CommandGroup>

          {(showAdmin || showTeam) && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Management">
                {showAdmin && (
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/dashboard/admin"))}
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </CommandItem>
                )}
                {showTeam && (
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/dashboard/team"))}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span>Team Workspace</span>
                  </CommandItem>
                )}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Study Tools">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/quizzes"))}
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              <span>Study Quizzes</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/flashcards"))}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              <span>Flashcards</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/profile"))}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* ── User Quick-View Profile Modal ─────────────────────── */}
      {profileUser && (
        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
              <DialogDescription>
                Viewing profile for {profileUser.full_name}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-6 py-2">
              {/* Header row */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border flex-shrink-0">
                  <AvatarImage src={getAvatarUrl(profileUser.avatar_url)} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {getInitials(profileUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <h3 className="text-xl font-bold truncate">
                    {profileUser.full_name || "Unnamed User"}
                  </h3>
                  {profileUser.email && (
                    <p className="text-sm text-muted-foreground truncate">{profileUser.email}</p>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      ROLE_COLORS[getRoleName(profileUser.roles)] || ROLE_COLORS.learner
                    }
                  >
                    {getRoleName(profileUser.roles).replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 p-3 border rounded-md">
                  <span className="text-xs text-muted-foreground font-medium uppercase">Program</span>
                  <span className="text-sm font-medium">{profileUser.degree_program || "Not specified"}</span>
                </div>
                <div className="flex flex-col gap-1 p-3 border rounded-md">
                  <span className="text-xs text-muted-foreground font-medium uppercase">Year Level</span>
                  <span className="text-sm font-medium">{profileUser.year_level || "Not specified"}</span>
                </div>
                <div className="flex flex-col gap-1 p-3 border rounded-md">
                  <span className="text-xs text-muted-foreground font-medium uppercase">Member #</span>
                  <span className="text-sm font-mono">{profileUser.membership_number || "PENDING"}</span>
                </div>
                <div className="flex flex-col gap-1 p-3 border rounded-md">
                  <span className="text-xs text-muted-foreground font-medium uppercase">Total XP</span>
                  <span className="text-sm font-bold text-amber-500">
                    {profileUser.total_xp ?? 0} XP
                  </span>
                </div>
              </div>

              {profileUser.bio && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Biography</span>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-muted/50 rounded-md">
                    {profileUser.bio}
                  </p>
                </div>
              )}

              {/* Action row */}
              <div className="flex items-center justify-between pt-1 border-t">
                {showAdmin && (
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push(
                        `/dashboard/admin/users?search=${encodeURIComponent(profileUser.full_name)}`,
                      );
                    }}
                    className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
                  >
                    View in User Management →
                  </button>
                )}
                <div className="ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                    onClick={() => initiateBlock(profileUser)}
                  >
                    <ShieldOff className="h-4 w-4" />
                    Block User
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Block Confirmation Dialog ──────────────────────────── */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-destructive" />
              Block {blockTarget?.full_name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They will no longer appear in your search results and you will not
              appear in theirs. You can unblock them later from your profile settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBlock}
              disabled={isBlocking}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isBlocking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
