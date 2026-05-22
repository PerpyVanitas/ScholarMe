"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  rank: number;
  id: string;
  fullName: string;
  avatarUrl: string | null;
  totalXp: number;
  currentLevel: number;
  isCurrentUser: boolean;
}

import { ErrorBoundary } from "@/components/error-boundary";

function LeaderboardContent() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadLeaderboard() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const res = await fetch("/api/android/gamification/leaderboard?limit=20", {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      const result = await res.json();

      if (result.success) {
        setLeaderboard(result.data.leaderboard);
      }
      setLoading(false);
    }

    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black tracking-tight flex items-center justify-center gap-3">
          <Trophy className="h-10 w-10 text-yellow-500" />
          Global Leaderboard
        </h1>
        <p className="text-muted-foreground">Compete with learners worldwide and climb the ranks!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top 3 Podium */}
        {leaderboard.slice(0, 3).map((entry, index) => (
          <Card key={entry.id} className={`relative overflow-hidden border-2 ${
            index === 0 ? "border-yellow-500 bg-yellow-50/10" : 
            index === 1 ? "border-slate-300 bg-slate-50/10" : 
            "border-amber-600 bg-amber-50/10"
          }`}>
            <CardContent className="pt-8 text-center space-y-4">
              <div className="absolute top-2 right-2">
                {index === 0 ? <Trophy className="h-6 w-6 text-yellow-500" /> : 
                 index === 1 ? <Medal className="h-6 w-6 text-slate-400" /> : 
                 <Medal className="h-6 w-6 text-amber-600" />}
              </div>
              <div className="flex justify-center">
                <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                  <AvatarImage src={entry.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.fullName}`} />
                  <AvatarFallback>{entry.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h3 className="font-bold text-xl truncate">{entry.fullName}</h3>
                <p className="text-sm font-medium text-primary">Level {entry.currentLevel}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-full py-1 px-4 inline-block shadow-sm border">
                <span className="font-black text-lg">{entry.totalXp}</span>
                <span className="text-xs ml-1 text-muted-foreground">XP</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Rankings
          </CardTitle>
          <CardDescription>Top learners based on total XP earned.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {leaderboard.map((entry) => (
              <div 
                key={entry.id} 
                className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                  entry.isCurrentUser ? "bg-primary/5 border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="w-8 text-center font-black text-muted-foreground">
                  {entry.rank}
                </div>
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={entry.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.fullName}`} />
                  <AvatarFallback>{entry.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold flex items-center gap-2">
                    {entry.fullName}
                    {entry.isCurrentUser && <Badge variant="secondary" className="text-[10px]">YOU</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">Level {entry.currentLevel}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">{entry.totalXp}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Total XP</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <ErrorBoundary>
      <LeaderboardContent />
    </ErrorBoundary>
  )
}
