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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GraduationCap,
  LayoutDashboard,
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
} from "lucide-react";
import { signOut } from "@/app/auth/actions";

interface AppSidebarProps {
  profile: Profile;
  role: UserRole;
  notificationCount: number;
}

function getNavItems(role: UserRole) {
  const shared = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { title: "Profile", href: "/dashboard/profile", icon: UserCircle },
  ];

  const learnerItems = [
    { title: "Find Tutors", href: "/dashboard/tutors", icon: Users },
    { title: "My Sessions", href: "/dashboard/sessions", icon: Calendar },
    { title: "Resources", href: "/dashboard/resources", icon: BookOpen },
  ];

  const tutorItems = [
    { title: "Find Tutors", href: "/dashboard/tutors", icon: Users },
    { title: "My Sessions", href: "/dashboard/sessions", icon: Calendar },
    { title: "Availability", href: "/dashboard/availability", icon: Clock },
    { title: "My Repositories", href: "/dashboard/resources", icon: FolderOpen },
  ];

  const adminItems = [
    { title: "Users", href: "/dashboard/admin/users", icon: Users },
    { title: "Cards", href: "/dashboard/admin/cards", icon: CreditCard },
    { title: "All Sessions", href: "/dashboard/admin/sessions", icon: Calendar },
    { title: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
    { title: "Resources", href: "/dashboard/resources", icon: FolderOpen },
  ];

  const roleItems = {
    learner: learnerItems,
    tutor: tutorItems,
    administrator: adminItems,
  };

  return { shared, roleSpecific: roleItems[role] || learnerItems };
}

const roleLabels: Record<UserRole, string> = {
  learner: "Learner",
  tutor: "Tutor",
  administrator: "Admin",
};

export function AppSidebar({ profile, role, notificationCount }: AppSidebarProps) {
  const pathname = usePathname();
  const { shared, roleSpecific } = getNavItems(role);
  const initials = profile.full_name
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
              <Link href="/dashboard">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <GraduationCap className="h-4 w-4 text-primary-foreground" />
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
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {shared.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>{roleLabels[role]} Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {roleSpecific.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="text-sm font-medium truncate">
                      {profile.full_name || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {profile.email}
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
