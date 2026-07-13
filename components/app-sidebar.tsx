/** App sidebar -- role-aware navigation with user menu and notification badge. */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import type { Profile, UserRole } from "@/lib/types";
import { getAvatarUrl } from "@/lib/utils";
import {
  AUDIT_ROLES,
  FINANCE_REVIEW_ROLES,
  FINANCE_VIEW_ROLES,
  GOVERNANCE_ROLES,
  ROLE_LABELS,
  TEAMWORK_ROLES,
  TUTOR_ROLES,
  EXECUTIVE_ROLES,
  COMMITTEE_LEADERSHIP,
  ADMIN_ROLES,
  hasAnyRole,
  isEsasScholar,
} from "@/lib/utils/roles";
import type { LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Users,
  Calendar,
  BookOpen,
  FolderOpen,
  Bell,
  Settings,
  LogOut,
  ChevronsUpDown,
  Clock,
  Timer,
  Vote,
  Lightbulb,
  MessageSquare,
  LayoutDashboard,
  Trophy,
  ShieldAlert,
  ChevronRight,
  FileText,
  Bug,
  BarChart,
  Camera,
  UserCog,
  Bot,
  History,
  Pin,
  PinOff,
  Activity,
  FileSpreadsheet,
  ShieldCheck,
  Receipt,
  Globe,
  Network,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { HonorSocietyLogo } from "@/components/honsoc-logo";
import { A11ySettings } from "@/components/a11y-settings";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface AppSidebarProps {
  profile: Profile;
  role: UserRole;
  notificationCount: number;
}

function getNavItems(role: UserRole, profile: Profile) {
  // Core items available to everyone
  const coreItems = [
    { title: "Dashboard", href: "/dashboard/home", icon: LayoutDashboard },
    { title: "Profile", href: "/dashboard/profile", icon: Settings },
    { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ];

  // Study Tools
  const studyItems = [
    { title: "Study Quizzes", href: "/dashboard/quizzes", icon: Lightbulb },
    { title: "AI Tutor", href: "/dashboard/ai-tutor", icon: Bot },
    { title: "Flashcards", href: "/dashboard/flashcards", icon: FolderOpen },
  ];

  // Library & Resources
  const libraryItems = [
    {
      title: "Digital Resources",
      href: "/dashboard/resources",
      icon: BookOpen,
    },
    {
      title: "Physical Library",
      href: "/dashboard/resources/library",
      icon: BookOpen,
    },
  ];

  // Community items depending on role
  const communityItems = [
    { title: "Events Calendar", href: "/dashboard/calendar", icon: Calendar },
    ...(role === "learner"
      ? [
          { title: "Find Tutors", href: "/dashboard/tutors", icon: Users },
          { title: "My Sessions", href: "/dashboard/sessions", icon: Calendar },
        ]
      : [
          {
            title: role === "tutor" ? "Tutoring Sessions" : "Sessions",
            href: "/dashboard/sessions",
            icon: Calendar,
          },
        ]),
    { title: "Community Hub", href: "/dashboard/forums", icon: MessageSquare },
    { title: "Study Groups", href: "/dashboard/groups", icon: Users },
    { title: "My Messages", href: "/dashboard/messages", icon: MessageSquare },
    { title: "Voting", href: "/dashboard/voting", icon: Vote },
    { title: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
  ];

  // Admin/Tutor specific management tools
  const managementGroups: {
    label: string;
    items: { title: string; href: string; icon: LucideIcon }[];
  }[] = [];

  // Honor Society (Tutor / Officers)
  if (hasAnyRole(role, TUTOR_ROLES)) {
    const hsItems = [];
    if (hasAnyRole(role, TUTOR_ROLES)) {
      hsItems.push(
        { title: "My Timesheet", href: "/dashboard/timesheet", icon: Timer },
        { title: "Availability", href: "/dashboard/availability", icon: Clock },
        {
          title: "Peer Reviews",
          href: "/dashboard/tutors/reviews",
          icon: ShieldCheck,
        },
      );
    }

    // If ESAS scholar, or anyone we want to track 90 hours for. Currently placing it in profile is better,
    // but we can add an ESAS Tracker link here.

    if (hasAnyRole(role, TEAMWORK_ROLES)) {
      hsItems.push({
        title: "Team Workspace",
        href: "/dashboard/team",
        icon: Users,
      });
    }

    managementGroups.push({
      label: "Honor Society",
      items: hsItems,
    });
  }

  // Executive Board
  if (hasAnyRole(role, EXECUTIVE_ROLES) || hasAnyRole(role, ADMIN_ROLES)) {
    managementGroups.push({
      label: "Executive Board",
      items: [
        {
          title: "Admin Dashboard",
          href: "/dashboard/admin",
          icon: LayoutDashboard,
        },
        {
          title: "User Management",
          href: "/dashboard/admin/users",
          icon: Users,
        },
        {
          title: "Mastery Verifications",
          href: "/dashboard/admin/verifications",
          icon: ShieldCheck,
        },
        {
          title: "Tutor Analytics",
          href: "/dashboard/admin/tutor-stats",
          icon: BarChart,
        },
        {
          title: "Payroll & Timesheets",
          href: "/dashboard/admin/timesheets",
          icon: Clock,
        },
      ],
    });
  }

  // Committee Management
  if (
    hasAnyRole(role, COMMITTEE_LEADERSHIP) ||
    hasAnyRole(role, EXECUTIVE_ROLES) ||
    hasAnyRole(role, ADMIN_ROLES)
  ) {
    managementGroups.push({
      label: "Committee Management",
      items: [
        { title: "QR Scanner", href: "/dashboard/admin/scanner", icon: Camera },
        {
          title: "Data Export",
          href: "/dashboard/admin/export",
          icon: FileSpreadsheet,
        },
      ],
    });
  }

  // Finance & Audit
  if (hasAnyRole(role, FINANCE_VIEW_ROLES)) {
    const financeItems = [
      {
        title: "Finance Dashboard",
        href: "/dashboard/finance",
        icon: FileText,
      },
      {
        title: "Cash Register",
        href: "/dashboard/finance/register",
        icon: Receipt,
      },
    ];
    if (
      hasAnyRole(role, AUDIT_ROLES) ||
      hasAnyRole(role, FINANCE_REVIEW_ROLES)
    ) {
      financeItems.push({
        title: "Reports Hub",
        href: "/dashboard/admin/reports",
        icon: FileText,
      });
    }
    managementGroups.push({ label: "Finance & Audit", items: financeItems });
  }

  // IT Administration
  if (hasAnyRole(role, ADMIN_ROLES)) {
    const adminItems = [
      {
        title: "System Logs",
        href: "/dashboard/admin/logs",
        icon: ShieldAlert,
      },
      {
        title: "Integrations",
        href: "/dashboard/admin/integrations",
        icon: Settings,
      },
      {
        title: "System Health",
        href: "/dashboard/admin/health",
        icon: Activity,
      },
    ];
    if (role === "super_admin") {
      adminItems.push(
        {
          title: "Org Structure",
          href: "/dashboard/admin/org-structure",
          icon: Network,
        },
        {
          title: "Message Audit",
          href: "/dashboard/admin/messages",
          icon: MessageSquare,
        },
        {
          title: "User Feedback",
          href: "/dashboard/admin/feedback",
          icon: Bug,
        },
      );
    }
    managementGroups.push({ label: "IT Administration", items: adminItems });
  }

  const learnerGroups = [
    { label: "Core", items: coreItems },
    { label: "Study Tools", items: studyItems },
    { label: "Library & Resources", items: libraryItems },
    { label: "Community & Interaction", items: communityItems },
  ];

  return {
    learnerGroups,
    managementGroups,
    hasManagement: managementGroups.length > 0,
    hasTutorTools: hasAnyRole(role, TUTOR_ROLES),
  };
}

export function AppSidebar({
  profile,
  role,
  notificationCount,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { learnerGroups, managementGroups, hasManagement, hasTutorTools } =
    useMemo(() => getNavItems(role, profile), [role, profile]);
  const [workspace, setWorkspace] = useState<"learner" | "management">(
    "learner",
  );
  const navGroups = workspace === "learner" ? learnerGroups : managementGroups;

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const [logoClicks, setLogoClicks] = useState(0);
  const [recentVisits, setRecentVisits] = useState<
    { title: string; href: string }[]
  >([]);
  const [favorites, setFavorites] = useState<string[]>([]); // array of hrefs

  // Load pinned favorites
  useEffect(() => {
    try {
      const stored = localStorage.getItem("scholarme_favorites");
      if (stored) setFavorites(JSON.parse(stored));
    } catch (e) {
      console.warn("Failed to parse favorites from localStorage", e);
      toast.error("Failed to load your pinned favorites.");
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    e.stopPropagation();
    let newFavs = [...favorites];
    if (newFavs.includes(href)) {
      newFavs = newFavs.filter((f) => f !== href);
    } else {
      if (newFavs.length >= 5) {
        toast.error("You can only pin up to 5 favorites");
        return;
      }
      newFavs.push(href);
    }
    setFavorites(newFavs);
    localStorage.setItem("scholarme_favorites", JSON.stringify(newFavs));
  };

  // Maintain recently visited stack in localStorage
  useEffect(() => {
    if (!pathname || pathname === "/dashboard/home") return;

    try {
      const stored = localStorage.getItem("scholarme_recent_visits");
      let visits: { title: string; href: string }[] = stored
        ? JSON.parse(stored)
        : [];

      // Find title for current pathname
      let currentTitle = "Page";
      for (const group of learnerGroups.concat(managementGroups)) {
        for (const item of group.items) {
          if (item.href === pathname) {
            currentTitle = item.title;
            break;
          }
        }
      }

      // Don't log if it's not a known sidebar item or if it's the exact same page twice in a row
      if (
        currentTitle === "Page" ||
        (visits.length > 0 && visits[0].href === pathname)
      )
        return;

      visits = visits.filter((v) => v.href !== pathname); // Remove duplicates
      visits.unshift({ title: currentTitle, href: pathname }); // Add to front
      visits = visits.slice(0, 3); // Keep only top 3

      localStorage.setItem("scholarme_recent_visits", JSON.stringify(visits));
      setRecentVisits(visits);
    } catch (e) {
      console.error("Failed to parse recent visits", e);
      toast.error(e instanceof Error ? e.message : "An error occurred");
    }
  }, [pathname, navGroups]);

  // Load initial visits
  useEffect(() => {
    try {
      const stored = localStorage.getItem("scholarme_recent_visits");
      if (stored) setRecentVisits(JSON.parse(stored));
    } catch (e) {
      console.warn("Failed to parse recent visits from localStorage", e);
      toast.error("Failed to load your recent visits.");
    }
  }, []);

  const handleLogoClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);

    if (newClicks === 10) {
      toast.success("🔍 You found a secret!", {
        description: "Explorer Badge Unlocked!",
      });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      // Optionally grant XP here
      const { earnXp } = await import("@/lib/utils/gamification");
      await earnXp("SECRET_EGG_FOUND", "Found the secret explorer egg!");
      setLogoClicks(0);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {hasManagement ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary cursor-pointer text-primary-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        handleLogoClick(e as any);
                      }}
                    >
                      <HonorSocietyLogo variant="auto" className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">
                        {workspace === "learner"
                          ? "Learner Workspace"
                          : `${ROLE_LABELS[role]} Workspace`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ScholarMe
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                  <DropdownMenuItem onClick={() => setWorkspace("learner")}>
                    <div className="flex flex-col">
                      <span className="font-medium">Learner Workspace</span>
                      <span className="text-xs text-muted-foreground">
                        Core study tools
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setWorkspace("management")}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {ROLE_LABELS[role]} Workspace
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Management tools
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard/home">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary cursor-pointer text-primary-foreground"
                    onClick={handleLogoClick}
                  >
                    <HonorSocietyLogo variant="auto" className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">ScholarMe</span>
                    <span className="text-xs text-muted-foreground">
                      {ROLE_LABELS[role]}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {favorites.length > 0 && (
          <Collapsible defaultOpen={true} className="group/collapsible mb-2">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger>
                  Pinned Favorites
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {favorites.map((favHref) => {
                      // find the item from all possible groups to get the icon and title
                      let favItem = null;
                      for (const g of learnerGroups.concat(managementGroups)) {
                        const found = g.items.find((i) => i.href === favHref);
                        if (found) favItem = found;
                      }
                      if (!favItem) return null;
                      return (
                        <SidebarMenuItem key={`fav-${favHref}`}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === favHref}
                            tooltip={favItem.title}
                            className="group/favitem"
                          >
                            <Link href={favHref}>
                              <favItem.icon className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                {favItem.title}
                              </span>
                              <button
                                onClick={(e) => toggleFavorite(e, favHref)}
                                className="ml-auto opacity-0 group-hover/favitem:opacity-100 p-1 hover:bg-muted rounded text-muted-foreground"
                              >
                                <PinOff className="h-3 w-3" />
                              </button>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {navGroups.map((group, index) => {
          const isGroupActive = group.items.some(
            (item) =>
              pathname === item.href || pathname.startsWith(item.href + "/"),
          );
          return (
            <Collapsible
              defaultOpen={isGroupActive || index === 0}
              className="group/collapsible"
              key={index}
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger>
                    {group.label}
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href}
                            tooltip={item.title}
                          >
                            <Link href={item.href}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              {item.title === "Notifications" &&
                                notificationCount > 0 && (
                                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                                    {notificationCount > 99
                                      ? "99+"
                                      : notificationCount}
                                  </span>
                                )}
                              <button
                                onClick={(e) => toggleFavorite(e, item.href)}
                                className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded"
                                title={
                                  favorites.includes(item.href)
                                    ? "Unpin"
                                    : "Pin to Favorites"
                                }
                              >
                                {favorites.includes(item.href) ? (
                                  <PinOff className="h-3 w-3 text-primary" />
                                ) : (
                                  <Pin className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                )}
                              </button>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}

        {recentVisits.length > 0 && (
          <Collapsible defaultOpen={true} className="group/collapsible mt-4">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger>
                  Recently Visited
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {recentVisits.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          tooltip={item.title}
                        >
                          <Link href={item.href}>
                            <History className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {item.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={getAvatarUrl(profile?.avatar_url)}
                      alt={profile?.full_name || "User"}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                    <span className="text-sm font-bold truncate">
                      {profile?.full_name || "User"}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-primary truncate">
                      {profile?.current_level
                        ? `Level ${profile.current_level} • ${profile.total_xp} XP`
                        : "Novice"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Globe className="mr-2 h-4 w-4" />
                    Site Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={signOut}>
                    <button type="submit" className="flex w-full items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
