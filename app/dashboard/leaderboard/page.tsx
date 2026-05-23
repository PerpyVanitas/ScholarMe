"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, Target, BookOpen, Layers, Upload, BrainCircuit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getLevelTitle, getLevelColor } from "@/lib/utils/gamification";

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-8">
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
                    <Avatar className={`h-20 w-20 border-4 shadow-xl ${getLevelColor(entry.currentLevel)}`}>
                      <AvatarImage src={entry.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.fullName}`} />
                      <AvatarFallback>{entry.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl truncate">{entry.fullName}</h3>
                    <p className="text-sm font-medium text-primary">Level {entry.currentLevel} • {getLevelTitle(entry.currentLevel)}</p>
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
                    <Avatar className={`h-10 w-10 border-2 ${getLevelColor(entry.currentLevel)}`}>
                      <AvatarImage src={entry.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.fullName}`} />
                      <AvatarFallback>{entry.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold flex items-center gap-2">
                        {entry.fullName}
                        {entry.isCurrentUser && <Badge variant="secondary" className="text-[10px]">YOU</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">Level {entry.currentLevel} • {getLevelTitle(entry.currentLevel)}</p>
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

        {/* Sidebar: How to Earn XP */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                How to Earn XP
              </CardTitle>
              <CardDescription>Actions that grant experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-md">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Study a Quiz</p>
                  <p className="text-xs text-muted-foreground">+50 XP per completion</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-md">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Review Flashcards</p>
                  <p className="text-xs text-muted-foreground">+50 XP per completion</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-md">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Upload Resource</p>
                  <p className="text-xs text-muted-foreground">+100 XP per upload</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-md">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Create Study Set</p>
                  <p className="text-xs text-muted-foreground">+25 XP per creation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Titles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Level 1-4</span>
                <span className="font-bold text-slate-500">Novice</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Level 5-9</span>
                <span className="font-bold text-amber-600">Scholar</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Level 10-19</span>
                <span className="font-bold text-slate-400">Prodigy</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Level 20-49</span>
                <span className="font-bold text-yellow-600">Master</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Level 50+</span>
                <span className="font-bold text-purple-500">Grandmaster</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


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
