"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, UserPlus, GraduationCap, Users2, Library } from "lucide-react";

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "Users", href: "/dashboard/network/users", icon: Users },
    { name: "Friends", href: "/dashboard/network/friends", icon: UserPlus },
    { name: "Tutors", href: "/dashboard/network/tutors", icon: GraduationCap },
    { name: "Study Groups", href: "/dashboard/network/groups", icon: Users2 },
    { name: "Study Buddies", href: "/dashboard/network/study-buddies", icon: Users },
    { name: "Alumni", href: "/dashboard/network/alumni", icon: Library },
  ];

  return (
    <div className="flex-1 flex flex-col w-full mx-auto min-h-[calc(100vh-3.5rem)]">
      <div className="border-b bg-muted/10 px-6 py-4 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">People & Network</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect with learners, tutors, groups, and alumni.
          </p>
        </div>

        <div className="bg-muted text-muted-foreground inline-flex h-10 items-center justify-start rounded-lg p-1 w-full overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex flex-none items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:bg-background/50 hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
