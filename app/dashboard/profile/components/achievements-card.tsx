"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { UserBadge } from "@/lib/types";
import { Trophy, Medal, Star, Moon, BrainCircuit } from "lucide-react";
import { useUser } from "@/lib/user-context";

export function AchievementsCard() {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { profile } = useUser();

  useEffect(() => {
    async function loadBadges() {
      if (!profile) return;
      const { data, error } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", profile.id)
        .order("unlocked_at", { ascending: false });

      if (data) {
        setBadges(data as UserBadge[]);
      }
      setLoading(false);
    }
    loadBadges();
  }, [supabase, profile]);

  const getIcon = (name?: string) => {
    switch (name) {
      case "Night Owl":
        return <Moon className="h-6 w-6 text-indigo-500" />;
      case "Quiz Master":
        return <BrainCircuit className="h-6 w-6 text-pink-500" />;
      case "Tutor Star":
        return <Star className="h-6 w-6 text-yellow-500" />;
      default:
        return <Medal className="h-6 w-6 text-orange-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Achievements
        </CardTitle>
        <CardDescription>Badges you have unlocked</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Loading achievements...
          </p>
        ) : badges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              No badges yet
            </p>
            <p className="text-xs text-muted-foreground">
              Keep studying to unlock achievements!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg text-center space-y-2 border"
              >
                <div className="p-3 bg-background rounded-full shadow-sm">
                  {getIcon(badge.icon_name)}
                </div>
                <div>
                  <p className="text-sm font-bold">{badge.badge_name}</p>
                  {badge.badge_description && (
                    <p className="text-xs text-muted-foreground leading-tight mt-1">
                      {badge.badge_description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
