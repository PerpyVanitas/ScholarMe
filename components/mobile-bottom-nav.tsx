"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Calendar, Bell, User } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { notificationCount } = useUser();

  const NAV_ITEMS = [
    { title: "Home", href: "/dashboard/home", icon: LayoutDashboard },
    { title: "Finance", href: "/dashboard/finance", icon: BookOpen },
    { title: "Sessions", href: "/dashboard/sessions", icon: Calendar },
    {
      title: "Alerts",
      href: "/dashboard/notifications",
      icon: Bell,
      badge: notificationCount,
    },
    { title: "Profile", href: "/dashboard/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border/60 bg-background/80 backdrop-blur-lg px-2 pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.title}</span>
            {!!item.badge && item.badge > 0 && (
              <span className="absolute top-2 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
