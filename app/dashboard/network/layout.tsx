import { ReactNode } from "react";
import Link from "next/link";
import { Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NetworkLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="border-b bg-muted/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Community Network</h1>
          <p className="text-muted-foreground text-sm">
            Connect with peers and alumni
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/network/study-buddies">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Study Buddies
            </Button>
          </Link>
          <Link href="/dashboard/network/alumni">
            <Button variant="outline" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Alumni Network
            </Button>
          </Link>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        {children}
      </div>
    </div>
  );
}
