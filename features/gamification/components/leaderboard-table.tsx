"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAvatarUrl } from "@/lib/utils";
import { Crown, Medal, Trophy } from "lucide-react";

interface LeaderboardProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  total_xp: number;
  current_level: number;
  profile_theme_color: string | null;
}

interface LeaderboardTableProps {
  profiles: LeaderboardProfile[];
  currentUserId: string;
}

export function LeaderboardTable({
  profiles,
  currentUserId,
}: LeaderboardTableProps) {
  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-amber-700" />;
      default:
        return (
          <span className="text-lg font-bold text-muted-foreground w-6 text-center">
            {index + 1}
          </span>
        );
    }
  };

  const getThemeClass = (theme: string | null) => {
    switch (theme) {
      case "gold":
        return "border-yellow-500/50 bg-yellow-500/5 dark:border-yellow-500/30 dark:bg-yellow-500/10";
      case "purple":
        return "border-purple-500/50 bg-purple-500/5 dark:border-purple-500/30 dark:bg-purple-500/10";
      case "ruby":
        return "border-rose-600/50 bg-rose-600/5 dark:border-rose-500/30 dark:bg-rose-500/10";
      case "emerald":
        return "border-green-500/50 bg-green-500/5 dark:border-green-500/30 dark:bg-green-500/10";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {profiles.map((profile, index) => {
        const isMe = profile.id === currentUserId;
        const isTop3 = index < 3;

        return (
          <Card
            key={profile.id}
            className={`transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${isMe ? "ring-2 ring-primary" : ""} ${getThemeClass(profile.profile_theme_color)}`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex items-center justify-center w-10">
                {getRankBadge(index)}
              </div>

              <Avatar
                className={`h-12 w-12 ${isTop3 ? "ring-2 ring-offset-2 ring-yellow-500" : ""}`}
              >
                <AvatarImage src={getAvatarUrl(profile.avatar_url) || ""} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    {profile.full_name || "Unknown Scholar"}
                    {isMe && (
                      <Badge variant="default" className="text-[10px] h-5">
                        YOU
                      </Badge>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-3 w-3" />
                    <span>{profile.total_xp || 0} XP</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg px-4 py-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Level
                    </span>
                    <span className="text-xl font-black text-primary">
                      {profile.current_level || 1}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {profiles.length === 0 && (
        <Card className="border-dashed border-2 bg-muted/10 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted/50 p-5 mb-4 ring-1 ring-border shadow-inner">
              <Trophy className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2 text-foreground">The Leaderboard is Quiet...</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              No scholars have earned XP this season yet. Complete a study session or daily quest to claim the #1 spot!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
