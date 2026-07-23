"use client";

import Link from "next/link";
import { SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, Globe, ChevronsUpDown } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { getAvatarUrl } from "@/lib/utils";
import { TosLink, PrivacyLink } from "@/components/legal-modals";
import type { Profile } from "@/lib/types";

interface SidebarUserFooterProps {
  profile: Profile;
}

export function SidebarUserFooter({ profile }: SidebarUserFooterProps) {
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
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
  );
}
