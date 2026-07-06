/** App sidebar -- role-aware navigation with user menu and notification badge. */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { Profile, UserRole } from "@/lib/types";
import { getAvatarUrl } from "@/lib/utils";
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
} from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { HonorSocietyLogo } from "@/components/honsoc-logo";

interface AppSidebarProps {
  profile: Profile;
  role: UserRole;
  notificationCount: number;
}

function getNavItems(role: UserRole) {
  // Core items available to everyone
  const coreItems = [
    { title: "Dashboard", href: "/dashboard/home", icon: LayoutDashboard },
    { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { title: "Finance Dashboard", href: "/dashboard/finance", icon: BookOpen },
  ];

  const resourceTitle =
    role === "tutor"
      ? "My Repositories"
      : role === "administrator"
        ? "Resource Library"
        : "Resources";

  // Study items
  const studyItems = [
    { title: resourceTitle, href: "/dashboard/resources", icon: BookOpen },
    { title: "Physical Library", href: "/dashboard/resources/library", icon: BookOpen },
    { title: "Study Quizzes", href: "/dashboard/quizzes", icon: Lightbulb },
    { title: "Flashcards", href: "/dashboard/flashcards", icon: FolderOpen },
  ];

  // Community items depending on role
  const communityItems = [
    { title: "Events Calendar", href: "/dashboard/events", icon: Calendar },
    { title: "Find Tutors", href: "/dashboard/tutors", icon: Users },
    { title: "My Sessions", href: "/dashboard/sessions", icon: Calendar },
    { title: "My Messages", href: "/dashboard/messages", icon: MessageSquare },
    { title: "Voting", href: "/dashboard/voting", icon: Vote },
    { title: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
  ];

  // Admin/Tutor specific management tools
  let managementItems: { title: string; href: string; icon: LucideIcon }[] = [];
  if (role === "tutor") {
    managementItems = [
      { title: "My Timesheet", href: "/dashboard/timesheet", icon: Timer },
      { title: "Availability", href: "/dashboard/availability", icon: Clock },
    ];
  } else if (
    role === "administrator" ||
    role === "president" ||
    role === "super_admin"
  ) {
    managementItems = [
      {
        title: "Admin Dashboard",
        href: "/dashboard/admin",
        icon: LayoutDashboard,
      },
      {
        title: "Tutor Analytics",
        href: "/dashboard/admin/tutor-stats",
        icon: BarChart,
      },
      { title: "User Management", href: "/dashboard/admin/users", icon: Users },
      {
        title: "System Logs",
        href: "/dashboard/admin/logs",
        icon: ShieldAlert,
      },
      {
        title: "QR Scanner",
        href: "/dashboard/admin/scanner",
        icon: Camera,
      },
    ];
    if (role === "super_admin") {
      managementItems.push({
        title: "Message Audit",
        href: "/dashboard/admin/messages",
        icon: MessageSquare,
      });
      managementItems.push({
        title: "User Feedback",
        href: "/dashboard/admin/feedback",
        icon: Bug,
      });
      managementItems.push({
        title: "Role Management",
        href: "/dashboard/admin/roles",
        icon: UserCog,
      });
    }
  } else if (
    role === "finance_manager" ||
    role === "treasurer" ||
    role === "auditor" ||
    role === "committee_head" ||
    role === "faculty_adviser"
  ) {
    managementItems = [
      {
        title: "Finance Dashboard",
        href: "/dashboard/finance",
        icon: FileText,
      },
    ];
    if (role === "auditor") {
      managementItems.push(
        {
          title: "Reports Hub",
          href: "/dashboard/admin/reports",
          icon: FileText,
        },
        {
          title: "User Feedback",
          href: "/dashboard/admin/feedback",
          icon: Bug,
        },
      );
    }
  }

  // Add Team Workspace to relevant roles
  if (
    role === "officer" ||
    role === "president" ||
    role === "committee_head" ||
    role === "super_admin" ||
    role === "administrator"
  ) {
    if (!managementItems.some((item) => item.title === "Team Workspace")) {
      managementItems.push({
        title: "Team Workspace",
        href: "/dashboard/team",
        icon: Users,
      });
    }
  }

  const groups = [
    { label: "Core", items: coreItems },
    { label: "Academics & Study", items: studyItems },
    { label: "Community & Interaction", items: communityItems },
  ];

  if (managementItems.length > 0) {
    groups.push({ label: `${roleLabels[role]} Tools`, items: managementItems });
  }

  return groups;
}

const roleLabels: Record<UserRole, string> = {
  learner: "Learner",
  tutor: "Tutor",
  administrator: "Admin",
  finance_manager: "Finance",
  auditor: "Auditor",
  president: "President",
  treasurer: "Treasurer",
  committee_head: "Committee",
  faculty_adviser: "Adviser",
  super_admin: "Super Admin",
  officer: "Officer",
};

export function AppSidebar({
  profile,
  role,
  notificationCount,
}: AppSidebarProps) {
  const pathname = usePathname();
  const navGroups = useMemo(() => getNavItems(role), [role]);
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard/home">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <HonorSocietyLogo variant="auto" className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">ScholarMe</span>
                  <span className="text-xs text-muted-foreground">
                    {roleLabels[role]}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {navGroups.map((group, index) => (
          <Collapsible defaultOpen={index === 0} className="group/collapsible" key={index}>
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
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
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
