"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface StudySet {
  id: string;
  title: string;
  subject: string;
  description?: string;
  card_count?: number;
}
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BookOpen, X } from "lucide-react";
import Link from "next/link";

interface WeakTopicSuggestionsProps {
  weakTopics: string[];
}

export function WeakTopicSuggestions({ weakTopics }: WeakTopicSuggestionsProps) {
  const supabase = createClient();
  const [suggestedSets, setSuggestedSets] = useState<StudySet[]>([]);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadSuggestedStudySets() {
      if (weakTopics.length === 0) return;
      try {
        const { data: sets } = await supabase
          .from("study_sets")
          .select("*")
          .order("created_at", { ascending: false });

        if (!sets) return;

        // Filter study sets matching any of the weak topics
        const matched = sets.filter((set) =>
          weakTopics.some(
            (topic) =>
              set.title.toLowerCase().includes(topic.toLowerCase()) ||
              set.description?.toLowerCase().includes(topic.toLowerCase()) ||
              set.subject?.toLowerCase().includes(topic.toLowerCase())
          )
        );

        setSuggestedSets(matched.slice(0, 3));
      } catch (err) {
        console.error("Error loading weak topic suggestions:", err);
      }
    }

    loadSuggestedStudySets();
  }, [weakTopics, supabase]);

  const handleDismiss = (setId: string) => {
    setDismissed((prev) => ({ ...prev, [setId]: true }));
  };

  const activeSuggestions = suggestedSets.filter((set) => !dismissed[set.id]);

  if (activeSuggestions.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base font-semibold">Recommended Practice Study Sets</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Based on your weak topic trends, practice these targeted study sets to boost your accuracy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeSuggestions.map((set) => (
          <div
            key={set.id}
            className="p-3 rounded-lg border bg-card flex items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate text-foreground">{set.title}</span>
                {set.subject && <Badge variant="outline" className="text-[10px]">{set.subject}</Badge>}
              </div>
              <p className="text-muted-foreground truncate">{set.description || "No description provided."}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild size="sm" variant="default" className="h-7 text-xs gap-1">
                <Link href={`/dashboard/study-sets/${set.id}`}>
                  <BookOpen className="h-3.5 w-3.5" /> Study
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => handleDismiss(set.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
