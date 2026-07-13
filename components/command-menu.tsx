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
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import {
  canAccessFinance,
  GOVERNANCE_ROLES,
  TEAMWORK_ROLES,
  hasAnyRole,
} from "@/lib/utils/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/utils";

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

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { role } = useUser();
  const showFinance = canAccessFinance(role);
  const showAdmin = hasAnyRole(role, GOVERNANCE_ROLES);
  const showTeam = hasAnyRole(role, TEAMWORK_ROLES);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [users, setUsers] = React.useState<
    { id: string; full_name: string; avatar_url: string | null }[]
  >([]);
  const [isSearchingUsers, setIsSearchingUsers] = React.useState(false);

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

  React.useEffect(() => {
    if (!open || searchQuery.trim().length < 2) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setIsSearchingUsers(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .ilike("full_name", `%${searchQuery}%`)
        .limit(5);

      if (data) {
        setUsers(data);
      }
      setIsSearchingUsers(false);
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, open]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

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
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/home"))}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/tutors"))
              }
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Find a Tutor</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/resources"))
              }
            >
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Resource Library</span>
            </CommandItem>
            {showFinance && (
              <CommandItem
                onSelect={() =>
                  runCommand(() => router.push("/dashboard/finance"))
                }
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Finance</span>
              </CommandItem>
            )}
          </CommandGroup>
          {users.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Users">
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() =>
                      runCommand(() =>
                        router.push(`/dashboard/users/${user.id}`),
                      )
                    }
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={getAvatarUrl(user.avatar_url)} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.full_name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          {(showAdmin || showTeam) && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Management">
                {showAdmin && (
                  <CommandItem
                    onSelect={() =>
                      runCommand(() => router.push("/dashboard/admin"))
                    }
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </CommandItem>
                )}
                {showTeam && (
                  <CommandItem
                    onSelect={() =>
                      runCommand(() => router.push("/dashboard/team"))
                    }
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
              onSelect={() =>
                runCommand(() => router.push("/dashboard/quizzes"))
              }
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              <span>Study Quizzes</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/flashcards"))
              }
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              <span>Flashcards</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/profile"))
              }
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
