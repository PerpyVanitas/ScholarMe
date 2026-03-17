"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Archive, Share2, BookOpen, Search } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import useSWR from "swr";
import type { StudySet } from "@/lib/study-set-types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MyStudySetsPage() {
  const [type, setType] = useState<"my" | "shared" | "archived">("my");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [mode, setMode] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const queryParams = new URLSearchParams({
    type,
    ...(search && { search }),
    ...(difficulty !== "all" && { difficulty }),
    ...(mode !== "all" && { mode }),
  }).toString();

  const { data, isLoading, mutate } = useSWR(
    `/api/study-sets?${queryParams}`,
    fetcher
  );

  const studySets: StudySet[] = data?.studySets || [];

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study set?")) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/study-sets?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Failed to delete study set");
        return;
      }

      toast.success("Study set deleted");
      mutate();
    } catch (error) {
      toast.error("Failed to delete study set");
      console.error(error);
    } finally {
      setDeleting(null);
    }
  };

  const handleArchive = async (id: string, archived: boolean) => {
    try {
      const response = await fetch("/api/study-sets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, archived: !archived }),
      });

      if (!response.ok) {
        toast.error("Failed to update study set");
        return;
      }

      toast.success(archived ? "Study set unarchived" : "Study set archived");
      mutate();
    } catch (error) {
      toast.error("Failed to update study set");
      console.error(error);
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Study Sets</h1>
          <p className="text-muted-foreground">Manage and organize your study materials</p>
        </div>
        <Link href="/dashboard/study-generator">
          <Button>Create New Study Set</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type tabs */}
            <div className="flex gap-2">
              {(["my", "shared", "archived"] as const).map((t) => (
                <Button
                  key={t}
                  variant={type === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => setType(t)}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>

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
          </div>
        </CardContent>
      </Card>

      {/* Study sets grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : studySets.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No study sets found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studySets.map((set) => (
            <Card key={set.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{set.title}</CardTitle>
                    <CardDescription className="line-clamp-1">{set.description}</CardDescription>
                  </div>
                  <Badge variant={set.visibility === "shared" ? "default" : "secondary"}>
                    {set.visibility}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{set.question_count} questions</span>
                    <Badge className={getDifficultyColor(set.difficulty)} variant="outline">
                      {set.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="capitalize">{set.generation_mode}</span>
                  </div>
                </div>

                {set.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {set.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Link href={`/dashboard/study/${set.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Study
                    </Button>
                  </Link>

                  {set.visibility === "private" && type === "my" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(set.id, set.archived)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}

                  {type === "my" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(set.id)}
                      disabled={deleting === set.id}
                    >
                      {deleting === set.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
