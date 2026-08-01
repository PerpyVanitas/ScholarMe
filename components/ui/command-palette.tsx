"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Search,
  BookOpen,
  Calendar,
  Clock,
  ShieldAlert,
  Users,
  Award,
  DollarSign,
  HelpCircle,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  category: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COMMAND_ITEMS: CommandItem[] = [
  { id: "dashboard", title: "Dashboard Home", category: "General", href: "/dashboard", icon: BookOpen },
  { id: "sessions", title: "Find & Book Tutors", category: "Learning", href: "/dashboard/sessions", icon: Users },
  { id: "quizzes", title: "Quizzes & Flashcards", category: "Learning", href: "/dashboard/quizzes", icon: Award },
  { id: "resources", title: "Digital Library", category: "Learning", href: "/dashboard/resources", icon: BookOpen },
  { id: "availability", title: "Manage Availability", category: "Tutor", href: "/dashboard/availability", icon: Calendar },
  { id: "timesheet", title: "My Timesheet", category: "Tutor", href: "/dashboard/timesheet", icon: Clock },
  { id: "finance", title: "Finance Dashboard", category: "Executive", href: "/dashboard/finance", icon: DollarSign },
  { id: "admin-users", title: "User Management", category: "Admin", href: "/dashboard/admin/users", icon: ShieldAlert },
  { id: "admin-analytics", title: "Analytics Overview", category: "Admin", href: "/dashboard/admin/analytics", icon: Users },
  { id: "support", title: "Support & Help", category: "General", href: "/dashboard/admin/support", icon: HelpCircle },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filtered = COMMAND_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search page... (Esc to cancel)"
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus-visible:ring-0"
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              No matching pages or tools found.
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.href)}
                    className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{item.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
