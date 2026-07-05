"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  users: "Users",
  roles: "Roles",
  sessions: "Sessions",
  analytics: "Analytics",
  timesheets: "Timesheets",
  messages: "Messages",
  reports: "Reports",
  finance: "Finance",
  team: "Team",
  tutors: "Tutors",
  leaderboard: "Leaderboard",
  quizzes: "Quizzes",
  flashcards: "Flashcards",
  resources: "Resources",
  notifications: "Notifications",
  profile: "Profile",
  voting: "Voting",
  availability: "Availability",
  scanner: "Scanner",
  home: "Home",
};

/**
 * Auto-generates a breadcrumb trail from the current pathname.
 * Skips the "/dashboard" root segment and uses SEGMENT_LABELS
 * to display human-readable names.
 */
export function BreadcrumbNav() {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter((s) => s !== "dashboard"); // skip the root prefix

  if (segments.length === 0) return null;

  // Build cumulative href for each breadcrumb item
  const crumbs = segments.map((seg, i) => {
    const href = "/dashboard/" + segments.slice(0, i + 1).join("/");
    const label = SEGMENT_LABELS[seg] ?? decodeURIComponent(seg);
    return { href, label, isLast: i === segments.length - 1 };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-xs text-muted-foreground select-none"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3 w-3" />
      </Link>

      {crumbs.map(({ href, label, isLast }) => (
        <span key={href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 opacity-40" />
          {isLast ? (
            <span className="font-medium text-foreground">{label}</span>
          ) : (
            <Link
              href={href}
              className="hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
