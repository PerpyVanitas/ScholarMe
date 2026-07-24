"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Medal,
  Star,
  Target,
  BookOpen,
  Layers,
  Upload,
  BrainCircuit,
  ChevronDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getLevelTitle, getLevelColor } from "@/lib/utils/gamification";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/error-boundary";

interface LeaderboardEntry {
  rank: number;
  id: string;
  fullName: string;
  avatarUrl: string | null;
  totalXp: number;
  currentLevel: number;
  isCurrentUser: boolean;
}

type Period = "all" | "monthly" | "weekly";

function LeaderboardContent() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserEntry, setCurrentUserEntry] =
    useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(20);
  const [period, setPeriod] = useState<Period>("all");

  useEffect(() => {
    const controller = new AbortController();
    loadLeaderboard(period, limit, controller.signal);
    return () => controller.abort();
  }, [period, limit]);

  async function loadLeaderboard(p: Period, lim: number, signal?: AbortSignal) {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const res = await fetch(
        `/api/android/gamification/leaderboard?limit=${lim}&period=${p}`,
        { signal }
      );
      const result = await res.json();

      if (result.success) {
        const entries: LeaderboardEntry[] = result.data.leaderboard;
        setLeaderboard(entries);

        // Find current user if not in top N
        const me = entries.find((e) => e.isCurrentUser);
        if (!me && result.data.currentUserEntry) {
          setCurrentUserEntry(result.data.currentUserEntry);
        } else {
          setCurrentUserEntry(null);
        }
      }
    } catch (e: unknown) {
      const err = e as Error;
      if (err.name === "AbortError") return;
      console.error(err);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }

  const podium = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

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
        <p className="text-muted-foreground">
          Compete with your peers and climb the ranks!
        </p>

        {/* Period Tabs */}
        <div className="flex justify-center pt-2">
          <Tabs
            value={period}
            onValueChange={(v) => {
              setPeriod(v as Period);
              setLimit(20);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="monthly">This Month</TabsTrigger>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-8">
          {/* Top 3 Podium */}
          {podium.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {podium.map((entry, index) => (
                <Card
                  key={entry.id}
                  className={`relative overflow-hidden border-2 ${
                    index === 0
                      ? "border-yellow-500 bg-yellow-50/10"
                      : index === 1
                        ? "border-slate-300 bg-slate-50/10"
                        : "border-amber-600 bg-amber-50/10"
                  } ${entry.isCurrentUser ? "ring-2 ring-primary ring-offset-2" : ""}`}
                >
                  <CardContent className="pt-8 text-center space-y-4">
                    <div className="absolute top-2 right-2">
                      {index === 0 ? (
                        <Trophy className="h-6 w-6 text-yellow-500" />
                      ) : (
                        <Medal
                          className={`h-6 w-6 ${index === 1 ? "text-slate-400" : "text-amber-600"}`}
                        />
                      )}
                    </div>
                    <div className="absolute top-2 left-2 font-black text-2xl text-muted-foreground/30">
                      #{entry.rank}
                    </div>
                    <div className="flex justify-center">
                      <Avatar
                        className={`h-20 w-20 border-4 shadow-xl ${getLevelColor(entry.currentLevel)}`}
                      >
                        <AvatarImage
                          src={
                            getAvatarUrl(entry.avatarUrl) ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.fullName}`
                          }
                        />
                        <AvatarFallback>
                          {entry.fullName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl truncate">
                        {entry.fullName}
                      </h3>
                      {entry.isCurrentUser && (
                        <Badge variant="secondary" className="text-[10px] mb-1">
                          YOU
                        </Badge>
                      )}
                      <p className="text-sm font-medium text-primary">
                        Level {entry.currentLevel} ·{" "}
                        {getLevelTitle(entry.currentLevel)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-full py-1 px-4 inline-block shadow-sm border">
                      <span className="font-black text-lg">
                        {entry.totalXp.toLocaleString()}
                      </span>
                      <span className="text-xs ml-1 text-muted-foreground">
                        XP
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Rankings Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Rankings
              </CardTitle>
              <CardDescription>
                {period === "all"
                  ? "All-time leaderboard"
                  : period === "monthly"
                    ? "This month's leaders"
                    : "This week's leaders"}{" "}
                · Top {leaderboard.length} shown
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {rest.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                      entry.isCurrentUser
                        ? "bg-primary/5 border-l-4 border-l-primary"
                        : ""
                    }`}
                  >
                    <div className="w-8 text-center font-black text-muted-foreground">
                      {entry.rank}
                    </div>
                    <Avatar
                      className={`h-10 w-10 border-2 ${getLevelColor(entry.currentLevel)}`}
                    >
                      <AvatarImage
                        src={
                          getAvatarUrl(entry.avatarUrl) ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.fullName}`
                        }
                      />
                      <AvatarFallback>
                        {entry.fullName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold flex items-center gap-2">
                        {entry.fullName}
                        {entry.isCurrentUser && (
                          <Badge variant="secondary" className="text-[10px]">
                            YOU
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Level {entry.currentLevel} ·{" "}
                        {getLevelTitle(entry.currentLevel)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">
                        {entry.totalXp.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Total XP
                      </p>
                    </div>
                  </div>
                ))}

                {/* Load More */}
                {leaderboard.length >= limit && (
                  <div className="p-4 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLimit((prev) => prev + 20)}
                    >
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show More
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current User Context (if not in top N) */}
          {currentUserEntry && (
            <>
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  Your position
                </span>
                <Separator className="flex-1" />
              </div>
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-8 text-center font-black text-primary">
                      #{currentUserEntry.rank}
                    </div>
                    <Avatar
                      className={`h-10 w-10 border-2 ${getLevelColor(currentUserEntry.currentLevel)}`}
                    >
                      <AvatarImage
                        src={getAvatarUrl(currentUserEntry.avatarUrl) || ""}
                      />
                      <AvatarFallback>
                        {currentUserEntry.fullName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold flex items-center gap-2">
                        {currentUserEntry.fullName}
                        <Badge variant="secondary" className="text-[10px]">
                          YOU
                        </Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Level {currentUserEntry.currentLevel} ·{" "}
                        {getLevelTitle(currentUserEntry.currentLevel)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">
                        {currentUserEntry.totalXp.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Total XP
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
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
              {[
                {
                  icon: BrainCircuit,
                  label: "Study a Quiz",
                  xp: "+50 XP per completion",
                },
                {
                  icon: Layers,
                  label: "Review Flashcards",
                  xp: "+50 XP per completion",
                },
                {
                  icon: Upload,
                  label: "Upload Resource",
                  xp: "+100 XP per upload",
                },
                {
                  icon: BookOpen,
                  label: "Create Study Set",
                  xp: "+25 XP per creation",
                },
              ].map(({ icon: Icon, label, xp }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-1 bg-primary/10 p-2 rounded-md">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{xp}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Titles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  range: "Level 1–4",
                  title: "Novice",
                  color: "text-slate-500",
                },
                {
                  range: "Level 5–9",
                  title: "Scholar",
                  color: "text-amber-600",
                },
                {
                  range: "Level 10–19",
                  title: "Prodigy",
                  color: "text-slate-400",
                },
                {
                  range: "Level 20–49",
                  title: "Master",
                  color: "text-yellow-600",
                },
                {
                  range: "Level 50+",
                  title: "Grandmaster",
                  color: "text-purple-500",
                },
              ].map(({ range, title, color }) => (
                <div key={range} className="flex justify-between text-sm">
                  <span>{range}</span>
                  <span className={`font-bold ${color}`}>{title}</span>
                </div>
              ))}
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
  );
}
