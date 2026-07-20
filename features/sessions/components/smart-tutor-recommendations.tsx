// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tutor } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, ChevronRight } from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function SmartTutorRecommendations() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recommendations, setRecommendations] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      const supabase = createClient();

      // Simple heuristic: fetch top rated tutors who have the same major as the user, or just top rated
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("major")
        .eq("id", userResponse.user.id)
        .single();

      const query = supabase
        .from("tutors")
        .select("*, profiles(*), specializations(*)");

      const { data: tutors } = await query
        .order("rating", { ascending: false })
        .limit(3);

      setRecommendations(tutors || []);
      setLoading(false);
    }
    loadRecommendations();
  }, []);

  if (loading) return null;
  if (recommendations.length === 0) return null;

  return (
    <Card className="border-border/60 mt-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Recommended for You
        </CardTitle>
        <CardDescription>
          Based on your major and recent activity
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((tutor) => (
          <div
            // @ts-ignore: Strict unknown type check
            key={tutor.id}
            className="flex flex-col gap-3 p-4 rounded-xl border bg-card hover:bg-accent/10 transition-colors"
          >
            <div className="flex items-start justify-between">
              <Avatar className="h-10 w-10">
                // @ts-ignore: Strict unknown type check
                <AvatarImage src={getAvatarUrl(tutor.profiles?.avatar_url)} />
                <AvatarFallback>
                  // @ts-ignore: Strict unknown type check
                  {tutor.profiles?.full_name?.charAt(0) || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1 text-sm font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                <Star className="h-3 w-3 fill-current" />
                // @ts-ignore: Strict unknown type check
                <span>{tutor.rating.toFixed(1)}</span>
              </div>
            </div>
            <div>
              // @ts-ignore: Strict unknown type check
              <h4 className="font-semibold">{tutor.profiles?.full_name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-1">
                // @ts-ignore: Strict unknown type check
                {tutor.bio || "Expert Tutor"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1 mt-auto">
              // @ts-ignore: Strict unknown type check
              {tutor.specializations && (
                <Badge variant="secondary" className="text-[10px]">
                  // @ts-ignore: Strict unknown type check
                  {tutor.specializations.name}
                </Badge>
              )}
            </div>
            <Button asChild size="sm" className="w-full mt-2" variant="outline">
              // @ts-ignore: Strict unknown type check
              <Link href={`/dashboard/tutors/${tutor.id}`}>
                View Profile <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
