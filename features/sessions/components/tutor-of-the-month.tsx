"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { getAvatarUrl } from "@/lib/utils";

interface TopTutor {
  fullName: string;
  avatarUrl?: string;
  specialization: string;
  rating: number;
  totalSessions: number;
}

export function TutorOfTheMonth() {
  const [topTutor, setTopTutor] = useState<TopTutor | null>(null);

  useEffect(() => {
    async function loadTopTutor() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("tutors")
          .select("*, profiles(*), tutor_specializations(specializations(*))")
          .order("rating", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          const profile = data.profiles as unknown as { full_name?: string; avatar_url?: string };
          const specs = data.tutor_specializations as unknown as Array<{ specializations?: { name?: string } }>;
          const specName = specs?.[0]?.specializations?.name || "Peer Tutor";

          setTopTutor({
            fullName: profile?.full_name || "Featured Tutor",
            avatarUrl: profile?.avatar_url,
            specialization: specName,
            rating: data.rating || 5.0,
            totalSessions: data.total_sessions || 0,
          });
        }
      } catch (err) {
        console.error("Failed to load top tutor:", err);
      }
    }
    loadTopTutor();
  }, []);

  const tutorName = topTutor?.fullName || "Featured Tutor";
  const initials = tutorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="border-amber-500/20 bg-amber-500/[0.02] relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Medal className="w-24 h-24 text-amber-500" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base text-amber-600 dark:text-amber-500">Tutor of the Month</CardTitle>
        </div>
        <CardDescription>Highest rated tutor this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mt-2">
          <Avatar className="h-16 w-16 border-2 border-amber-500/50">
            <AvatarImage src={getAvatarUrl(topTutor?.avatarUrl)} alt={tutorName} />
            <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-lg leading-none">{tutorName}</h3>
            <p className="text-sm text-muted-foreground">{topTutor?.specialization || "Academic Specialist"}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                {topTutor ? `${topTutor.rating.toFixed(1)} (${topTutor.totalSessions} sessions)` : "Top Rated"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
