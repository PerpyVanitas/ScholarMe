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
        <CommandInput placeholder="Type a command or search..." />
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
