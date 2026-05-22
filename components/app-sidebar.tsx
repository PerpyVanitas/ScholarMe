/** App sidebar -- role-aware navigation with user menu and notification badge. */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile, UserRole } from "@/lib/types";
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
  GraduationCap,
  Users,
  Calendar,
  BookOpen,
  FolderOpen,
  Bell,
  Settings,
  LogOut,
  ChevronsUpDown,
  CreditCard,
  BarChart3,
  UserCircle,
  Clock,
  Timer,
  Vote,
  Lightbulb,
  MessageSquare,
  LayoutDashboard,
  Trophy,
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
  ];

  // Study items depending on role
  let studyItems: { title: string; href: string; icon: any }[] = [];
  if (role === "learner") {
    studyItems = [
      { title: "Resources", href: "/dashboard/resources", icon: BookOpen },
      { title: "Study Quizzes", href: "/dashboard/quizzes", icon: Lightbulb },
      { title: "Flashcards", href: "/dashboard/flashcards", icon: BookOpen },
    ];
  } else if (role === "tutor") {
    studyItems = [
      { title: "My Repositories", href: "/dashboard/resources", icon: FolderOpen },
      { title: "Study Quizzes", href: "/dashboard/quizzes", icon: Lightbulb },
      { title: "Flashcards", href: "/dashboard/flashcards", icon: BookOpen },
    ];
  } else if (role === "administrator") {
    studyItems = [
      { title: "All Resources", href: "/dashboard/resources", icon: FolderOpen },
      { title: "Study Quizzes", href: "/dashboard/quizzes", icon: Lightbulb },
      { title: "Flashcards", href: "/dashboard/flashcards", icon: BookOpen },
    ];
  }

  // Community items depending on role
  let communityItems: { title: string; href: string; icon: any }[] = [];
  if (role === "learner") {
    communityItems = [
      { title: "Find Tutors", href: "/dashboard/tutors", icon: Users },
      { title: "My Sessions", href: "/dashboard/sessions", icon: Calendar },
      { title: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      { title: "Voting", href: "/dashboard/voting", icon: Vote },
      { title: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
    ];
  } else if (role === "tutor" || role === "administrator") {
    communityItems = [
      { title: "Find Tutors", href: "/dashboard/tutors", icon: Users },
      { title: "My Sessions", href: "/dashboard/sessions", icon: Calendar },
      { title: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      { title: "Voting", href: "/dashboard/voting", icon: Vote },
      { title: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
    ];
  }

  // Admin/Tutor specific management tools
  let managementItems: { title: string; href: string; icon: any }[] = [];
  if (role === "tutor") {
    managementItems = [
      { title: "Timesheet", href: "/dashboard/timesheet", icon: Timer },
      { title: "Availability", href: "/dashboard/availability", icon: Clock },
    ];
  } else if (role === "administrator") {
    managementItems = [
      { title: "Users Management", href: "/dashboard/admin/users", icon: Users },
      { title: "All Sessions", href: "/dashboard/admin/sessions", icon: Calendar },
      { title: "Timesheets", href: "/dashboard/admin/timesheets", icon: Timer },
      { title: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
      { title: "User Messages", href: "/dashboard/admin/messages", icon: MessageSquare },
    ];
  }

  const groups = [
    { label: "Core", items: coreItems },
    { label: "Academics & Study", items: studyItems }
  ];

  if (communityItems.length > 0) {
    groups.push({ label: "Community & Interaction", items: communityItems });
  }
  
  if (managementItems.length > 0) {
    groups.push({ label: `${roleLabels[role]} Tools`, items: managementItems });
  }

  return groups;
}

const roleLabels: Record<UserRole, string> = {
  learner: "Learner",
  tutor: "Tutor",
  administrator: "Admin",
};

export function AppSidebar({ profile, role, notificationCount }: AppSidebarProps) {
  const pathname = usePathname();
  const navGroups = getNavItems(role);
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  // Get display URL for avatar (handles private blob pathnames)
  const getAvatarUrl = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return undefined;
    if (avatarUrl.startsWith("avatars/")) {
      return `/api/avatar?pathname=${encodeURIComponent(avatarUrl)}`;
    }
    return avatarUrl;
  };

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
                  <span className="text-xs text-muted-foreground">{roleLabels[role]}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {navGroups.map((group, index) => (
          <SidebarGroup key={index}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.title === "Notifications" && notificationCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                            {notificationCount > 99 ? "99+" : notificationCount}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(profile?.avatar_url)} alt={profile?.full_name || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                    <span className="text-sm font-bold truncate">
                      {profile?.full_name || "User"}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-primary truncate">
                      {profile?.current_level ? `Level ${profile.current_level} • ${profile.total_xp} XP` : "Novice"}
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
