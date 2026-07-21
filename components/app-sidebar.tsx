/** App sidebar -- role-aware navigation with user menu and notification badge. */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { useDashboardMode } from "@/lib/hooks/use-dashboard-mode";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
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
  Layers,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { HonorSocietyLogo } from "@/components/honsoc-logo";
import { A11ySettings } from "@/components/a11y-settings";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { TosLink, PrivacyLink } from "@/components/legal-modals";

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
    { title: "Study Sets", href: "/dashboard/study-sets", icon: Layers },
    { title: "AI Tutor", href: "/dashboard/ai-tutor", icon: Bot },
  ];

  // Library & Resources
  const libraryItems = [
    {
      title: "Library & Resources",
      href: "/dashboard/resources",
      icon: BookOpen,
    },
  ];

  // Community items depending on role
  const communityItems = [
    { title: "Events Calendar", href: "/dashboard/calendar", icon: Calendar },
    { title: "People & Network", href: "/dashboard/network", icon: Network },
    ...(role === "learner"
      ? [{ title: "My Sessions", href: "/dashboard/sessions", icon: Calendar }]
      : [
          {
            title: role === "tutor" ? "Tutoring Sessions" : "Sessions",
            href: "/dashboard/sessions",
            icon: Calendar,
          },
        ]),
    { title: "Community Hub", href: "/dashboard/forums", icon: MessageSquare },
    { title: "My Messages", href: "/dashboard/messages", icon: MessageSquare },
    { title: "Voting", href: "/dashboard/voting", icon: Vote },
    { title: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
  ];

  const usersItems = [];
  const academicItems = [];
  const financeItems = [];
  const systemItems = [];

  // 1. Users & Access
  if (hasAnyRole(role, EXECUTIVE_ROLES) || hasAnyRole(role, ADMIN_ROLES)) {
    usersItems.push({
      title: "User Management",
      href: "/dashboard/admin/users",
      icon: Users,
    });
  }
  if (role === "super_admin") {
    usersItems.push(
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
    );
  }

  // 2. Academic & Tutoring
  if (hasAnyRole(role, TUTOR_ROLES)) {
    academicItems.push(
      { title: "My Timesheet", href: "/dashboard/timesheet", icon: Timer },
      { title: "Availability", href: "/dashboard/availability", icon: Clock },
      {
        title: "Peer Reviews",
        href: "/dashboard/tutors/reviews",
        icon: ShieldCheck,
      },
    );
  }
  if (hasAnyRole(role, EXECUTIVE_ROLES) || hasAnyRole(role, ADMIN_ROLES)) {
    academicItems.push(
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
    );
  }

  // 3. Financial & Operations
  if (hasAnyRole(role, FINANCE_VIEW_ROLES)) {
    financeItems.push(
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
    );
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
  }
  if (hasAnyRole(role, EXECUTIVE_ROLES) || hasAnyRole(role, ADMIN_ROLES)) {
    financeItems.push({
      title: "Payroll & Timesheets",
      href: "/dashboard/admin/timesheets",
      icon: Clock,
    });
  }
  if (
    hasAnyRole(role, COMMITTEE_LEADERSHIP) ||
    hasAnyRole(role, EXECUTIVE_ROLES) ||
    hasAnyRole(role, ADMIN_ROLES)
  ) {
    financeItems.push(
      { title: "QR Scanner", href: "/dashboard/admin/scanner", icon: Camera },
      {
        title: "Data Export",
        href: "/dashboard/admin/export",
        icon: FileSpreadsheet,
      },
    );
  }

  // 4. System Settings
  if (hasAnyRole(role, EXECUTIVE_ROLES) || hasAnyRole(role, ADMIN_ROLES)) {
    systemItems.push({
      title: "Admin Dashboard",
      href: "/dashboard/admin",
      icon: LayoutDashboard,
    });
  }
  if (hasAnyRole(role, TEAMWORK_ROLES)) {
    systemItems.push({
      title: "Team Workspace",
      href: "/dashboard/team",
      icon: Users,
    });
  }
  if (hasAnyRole(role, ADMIN_ROLES)) {
    systemItems.push(
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
    );
    if (role === "super_admin") {
      systemItems.push({
        title: "User Feedback",
        href: "/dashboard/admin/feedback",
        icon: Bug,
      });
    }
  }

  const managementGroups: {
    label: string;
    items: {
      title: string;
      href?: string;
      icon: LucideIcon;
      subItems?: { title: string; href: string; icon?: LucideIcon }[];
    }[];
  }[] = [];

  const adminCategories = [];
  if (usersItems.length > 0) {
    adminCategories.push({
      title: "Users & Access",
      icon: Users,
      subItems: usersItems,
    });
  }
  if (academicItems.length > 0) {
    adminCategories.push({
      title: "Academic & Tutoring",
      icon: BookOpen,
      subItems: academicItems,
    });
  }
  if (financeItems.length > 0) {
    adminCategories.push({
      title: "Financial & Operations",
      icon: Receipt,
      subItems: financeItems,
    });
  }
  if (systemItems.length > 0) {
    adminCategories.push({
      title: "System Settings",
      icon: Settings,
      subItems: systemItems,
    });
  }

  if (adminCategories.length > 0) {
    managementGroups.push({ label: "Management Tools", items: adminCategories });
  }

  const learnerGroups: typeof managementGroups = [
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
  // Sync workspace switcher with the shared dashboard mode hook so sidebar
  // and the dashboard cards always stay in sync.
  const { viewMode, setViewMode, canSwitch } = useDashboardMode(role);
  const workspace =
    canSwitch && viewMode === "learner"
      ? "learner"
      : hasManagement
        ? viewMode === "tutor"
          ? "management"
          : "learner"
        : "learner";
  const setWorkspace = (ws: "learner" | "management") => {
    if (canSwitch) setViewMode(ws === "management" ? "tutor" : "learner");
  };
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
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to parse favorites from localStorage", e);
      toast.error("Hmm, we couldn't load your pinned favorites right now.");
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
        toast.error(
          "Whoa there! You can only pin up to 5 favorites at a time. Unpin one to make room.",
        );
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
          if (item.subItems) {
            const sub = item.subItems.find((s) => s.href === pathname);
            if (sub) {
              currentTitle = sub.title;
              break;
            }
          }
        }
        if (currentTitle !== "Page") break;
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecentVisits(visits);
    } catch (e) {
      console.error("Failed to parse recent visits", e);
      toast.error(e instanceof Error ? e.message : "An error occurred");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Load initial visits
  useEffect(() => {
    try {
      const stored = localStorage.getItem("scholarme_recent_visits");
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecentVisits(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to parse recent visits from localStorage", e);
      toast.error("Hmm, we couldn't load your recent visits.");
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
                        handleLogoClick(e);
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
                      let favItem: { title: string; href: string; icon: LucideIcon } | null = null;
                      for (const g of learnerGroups.concat(managementGroups)) {
                        for (const i of g.items) {
                          if (i.href === favHref) {
                            favItem = i;
                            break;
                          }
                          if (i.subItems) {
                            const sub = i.subItems.find((s) => s.href === favHref);
                            if (sub) {
                              favItem = { ...sub, icon: sub.icon || i.icon };
                              break;
                            }
                          }
                        }
                        if (favItem) break;
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
                      {group.items.map((item) => {
                        if (item.subItems) {
                          const isSubActive = item.subItems.some(sub => pathname === sub.href || pathname.startsWith(sub.href + "/"));
                          return (
                            <Collapsible key={item.title} defaultOpen={isSubActive} className="group/submenu">
                              <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton tooltip={item.title}>
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.title}</span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/submenu:rotate-90" />
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub>
                                    {item.subItems.map(subItem => (
                                      <SidebarMenuSubItem key={subItem.title}>
                                        <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                          <Link href={subItem.href}>
                                            <span>{subItem.title}</span>
                                          </Link>
                                          <button
                                            onClick={(e) => toggleFavorite(e, subItem.href)}
                                            className="ml-auto opacity-0 group-hover/menu-sub-item:opacity-100 p-0.5 hover:bg-muted rounded"
                                            title={
                                              favorites.includes(subItem.href)
                                                ? "Unpin"
                                                : "Pin to Favorites"
                                            }
                                          >
                                            {favorites.includes(subItem.href) ? (
                                              <PinOff className="h-3 w-3 text-primary" />
                                            ) : (
                                              <Pin className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            )}
                                          </button>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))}
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </SidebarMenuItem>
                            </Collapsible>
                          );
                        }

                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              isActive={pathname === item.href}
                              tooltip={item.title}
                            >
                              <Link href={item.href!}>
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
                                  onClick={(e) => toggleFavorite(e, item.href!)}
                                  className="ml-auto opacity-0 group-hover/menu-button:opacity-100 p-1 hover:bg-muted rounded"
                                  title={
                                    favorites.includes(item.href!)
                                      ? "Unpin"
                                      : "Pin to Favorites"
                                  }
                                >
                                  {favorites.includes(item.href!) ? (
                                    <PinOff className="h-3 w-3 text-primary" />
                                  ) : (
                                    <Pin className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                  )}
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
        <div className="flex justify-center items-center gap-4 mt-4 px-2 py-1 text-[10px] text-muted-foreground/60">
          <TosLink className="hover:text-foreground transition-colors" />
          <span>&middot;</span>
          <PrivacyLink className="hover:text-foreground transition-colors" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
