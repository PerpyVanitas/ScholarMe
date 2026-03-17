"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, BookOpen, Star, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import useSWR from "swr";
import type { StudySet } from "@/lib/study-set-types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SharedQuizzesPage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [mode, setMode] = useState("all");
  const [sort, setSort] = useState("newest");

  const queryParams = new URLSearchParams({
    type: "shared",
    ...(search && { search }),
    ...(difficulty !== "all" && { difficulty }),
    ...(mode !== "all" && { mode }),
  }).toString();

  const { data, isLoading } = useSWR(
    `/api/study-sets?${queryParams}`,
    fetcher
  );

  const studySets: StudySet[] = data?.studySets || [];

  // Sort study sets
  const sortedSets = [...studySets].sort((a, b) => {
    switch (sort) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "alphabetical":
        return a.title.localeCompare(b.title);
      case "most-questions":
        return b.question_count - a.question_count;
      default:
        return 0;
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shared Study Sets</h1>
        <p className="text-muted-foreground">Browse and study materials shared by other users</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search study sets"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Difficulty filter */}
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            {/* Mode filter */}
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="flashcard">Flashcards</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
                <SelectItem value="most-questions">Most Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Study sets grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : sortedSets.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No shared study sets found</p>
            <p className="text-sm text-muted-foreground mt-2">Be the first to share a study set!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSets.map((set) => (
            <Card key={set.id} className="hover:border-primary/50 transition-colors flex flex-col">
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <CardTitle className="line-clamp-2 text-lg">{set.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{set.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>{set.question_count} questions</span>
                    </div>
                    <Badge className={getDifficultyColor(set.difficulty)} variant="outline">
                      {set.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-1 bg-secondary rounded text-xs font-medium capitalize">
                      {set.generation_mode}
                    </span>
                  </div>

                  {set.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {set.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {set.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{set.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Created {new Date(set.created_at).toLocaleDateString()}
                  </div>
                </div>

                <Link href={`/dashboard/study/${set.id}`} className="w-full">
                  <Button className="w-full" size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Study Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
