"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/card";
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

export function LeaderboardTable({ profiles, currentUserId }: LeaderboardTableProps) {
  
  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-amber-700" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
    }
  };

  const getThemeClass = (theme: string | null) => {
    switch (theme) {
      case 'gold': return "border-yellow-500/50 bg-yellow-500/5";
      case 'purple': return "border-purple-500/50 bg-purple-500/5";
      case 'ruby': return "border-red-500/50 bg-red-500/5";
      case 'emerald': return "border-green-500/50 bg-green-500/5";
      default: return "";
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
            className={`transition-all hover:shadow-md ${isMe ? 'ring-2 ring-primary' : ''} ${getThemeClass(profile.profile_theme_color)}`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex items-center justify-center w-10">
                {getRankBadge(index)}
              </div>
              
              <Avatar className={`h-12 w-12 ${isTop3 ? 'ring-2 ring-offset-2 ring-yellow-500' : ''}`}>
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    {profile.full_name || "Unknown Scholar"}
                    {isMe && <Badge variant="default" className="text-[10px] h-5">YOU</Badge>}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-3 w-3" />
                    <span>{profile.total_xp || 0} XP</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg px-4 py-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Level</span>
                    <span className="text-xl font-black text-primary">{profile.current_level || 1}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {profiles.length === 0 && (
        <div className="p-12 text-center text-muted-foreground border rounded-lg border-dashed">
          No scholars on the leaderboard yet. Be the first to earn XP!
        </div>
      )}
    </div>
  );
}
