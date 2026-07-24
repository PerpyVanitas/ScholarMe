"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Trash2,
  BookOpen,
  Users,
  Lock,
  FileText,
  Layers,
  Copy,
  Lightbulb,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import dynamic from "next/dynamic";

const CreateQuizSheet = dynamic(
  () =>
    import("../quizzes/components/create-quiz-sheet").then(
      (mod) => mod.CreateQuizSheet,
    ),
  { ssr: false },
);

const CreateFlashcardsSheet = dynamic(
  () =>
    import("../flashcards/components/create-flashcards-sheet").then(
      (mod) => mod.CreateFlashcardsSheet,
    ),
  { ssr: false },
);

interface StudySet {
  id: string;
  title: string;
  description: string | null;
  type: "flashcard" | "multiple_choice" | "true_false" | "mixed";
  is_public: boolean;
  created_at: string;
  study_set_items?: { count: number }[];
  profiles?: { full_name: string; avatar_url: string | null };
}

const TYPE_META: Record<string, { label: string; variant: "secondary" | "default" | "outline" }> = {
  flashcard: { label: "Flashcards", variant: "secondary" },
  multiple_choice: { label: "Quiz", variant: "secondary" },
  true_false: { label: "True/False", variant: "secondary" },
  mixed: { label: "Mixed", variant: "outline" },
};

function getTypeLabel(type: string) {
  return TYPE_META[type]?.label ?? type;
}

function StudySetsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") ?? "all";
  const [ownerTab, setOwnerTab] = useState<"my-sets" | "shared">("my-sets");
  const [typeFilter, setTypeFilter] = useState<string>(initialTab === "quizzes" ? "quiz" : initialTab === "flashcards" ? "flashcard" : "all");

  const [myStudySets, setMyStudySets] = useState<StudySet[]>([]);
  const [sharedStudySets, setSharedStudySets] = useState<StudySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [createQuizOpen, setCreateQuizOpen] = useState(false);
  const [createFlashcardsOpen, setCreateFlashcardsOpen] = useState(false);

  const loadStudySets = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const [myQuizRes, sharedQuizRes, myFlashRes, sharedFlashRes] =
        await Promise.all([
          fetch("/api/v1/quizzes/my-sets", { signal }),
          fetch("/api/v1/quizzes/shared", { signal }),
          fetch("/api/v1/flashcards/my-sets", { signal }),
          fetch("/api/v1/flashcards/shared", { signal }),
        ]);

      const combined: StudySet[] = [];
      const sharedCombined: StudySet[] = [];

      if (myQuizRes.ok) {
        const d = await myQuizRes.json();
        combined.push(...(d.data || []));
      }
      if (myFlashRes.ok) {
        const d = await myFlashRes.json();
        combined.push(...(d.data || []));
      }
      if (sharedQuizRes.ok) {
        const d = await sharedQuizRes.json();
        sharedCombined.push(...(d.data || []));
      }
      if (sharedFlashRes.ok) {
        const d = await sharedFlashRes.json();
        sharedCombined.push(...(d.data || []));
      }

      // Sort by created_at descending
      const sortByDate = (a: StudySet, b: StudySet) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

      setMyStudySets(combined.sort(sortByDate));
      setSharedStudySets(sharedCombined.sort(sortByDate));
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === "AbortError") return;
      console.error("Error loading study sets:", error);
      toast.error("Failed to load study sets — try refreshing the page.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadStudySets(controller.signal);
    return () => controller.abort();
  }, [loadStudySets]);

  const handleDelete = (id: string) => {
    const setToDelete = myStudySets.find((s) => s.id === id);
    if (!setToDelete) return;

    setMyStudySets((prev) => prev.filter((s) => s.id !== id));

    const isFlashcard =
      setToDelete.type === "flashcard" || setToDelete.type === "mixed";
    const endpoint = isFlashcard ? `/api/v1/flashcards/${id}` : `/api/v1/quizzes/${id}`;

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(endpoint, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete");
      } catch {
        toast.error("Failed to delete study set — try again.");
        await loadStudySets();
      }
    }, 5000);

    toast.success("Study set deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          clearTimeout(timeoutId);
          setMyStudySets((prev) =>
            [...prev, setToDelete].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            ),
          );
          toast.success("Delete undone");
        },
      },
      duration: 5000,
    });
  };

  const handleFork = async (set: StudySet) => {
    const isFlashcard = set.type === "flashcard" || set.type === "mixed";
    const endpoint = isFlashcard
      ? `/api/v1/flashcards/${set.id}/fork`
      : `/api/v1/quizzes/${set.id}/fork`;
    try {
      toast.loading("Forking set...", { id: "fork" });
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) throw new Error("Failed to fork");
      toast.success("Set forked to your study sets!", { id: "fork" });
      await loadStudySets();
      setOwnerTab("my-sets");
    } catch {
      toast.error("Failed to fork set — try again.", { id: "fork" });
    }
  };

  const activeSets =
    ownerTab === "my-sets" ? myStudySets : sharedStudySets;

  const filteredSets = activeSets.filter((s) => {
    if (typeFilter === "all") return true;
    if (typeFilter === "quiz")
      return s.type === "multiple_choice" || s.type === "true_false";
    if (typeFilter === "flashcard")
      return s.type === "flashcard" || s.type === "mixed";
    return true;
  });

  const getStudyHref = (set: StudySet) => {
    const isFlashcard = set.type === "flashcard" || set.type === "mixed";
    return isFlashcard
      ? `/dashboard/flashcards/study/${set.id}`
      : `/dashboard/quizzes/study/${set.id}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Study Sets
          </h1>
          <p className="text-sm text-muted-foreground">
            All your quizzes and flashcard sets in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCreateFlashcardsOpen(true)}
            className="gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            New Flashcards
          </Button>
          <Button
            onClick={() => setCreateQuizOpen(true)}
            className="gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            New Quiz
          </Button>
        </div>
      </div>

      {/* Owner filter (My Sets / Shared) */}
      <Tabs value={ownerTab} onValueChange={(v) => setOwnerTab(v as typeof ownerTab)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList>
            <TabsTrigger value="my-sets" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              My Sets
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Shared Sets
            </TabsTrigger>
          </TabsList>

          {/* Type filter pills */}
          <div className="flex items-center gap-1.5">
            {[
              { value: "all", label: "All", icon: Layers },
              { value: "quiz", label: "Quizzes", icon: Lightbulb },
              { value: "flashcard", label: "Flashcards", icon: FolderOpen },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  typeFilter === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {(["my-sets", "shared"] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : filteredSets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                  <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                  <p className="text-center text-muted-foreground">
                    {tab === "my-sets"
                      ? "No study sets yet. Create your first one!"
                      : "No shared study sets available yet."}
                  </p>
                  {tab === "my-sets" && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setCreateFlashcardsOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Flashcards
                      </Button>
                      <Button onClick={() => setCreateQuizOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Quiz
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSets.map((set) => (
                  <Card
                    key={set.id}
                    className="flex flex-col hover:border-primary/50 transition-colors"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{set.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {set.description || "No description"}
                          </CardDescription>
                        </div>
                        <Badge variant={TYPE_META[set.type]?.variant ?? "secondary"}>
                          {getTypeLabel(set.type)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {set.study_set_items?.[0]?.count || 0} items
                        </span>
                        {tab === "my-sets" ? (
                          <span className="flex items-center gap-1">
                            {set.is_public ? (
                              <Users className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                            {set.is_public ? "Public" : "Private"}
                          </span>
                        ) : (
                          <span>by {set.profiles?.full_name || "Unknown"}</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <Button asChild className="flex-1">
                          <Link href={getStudyHref(set)}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Study
                          </Link>
                        </Button>
                        {tab === "my-sets" ? (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(set.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="icon"
                            title="Fork to My Sets"
                            onClick={() => handleFork(set)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CreateQuizSheet
        open={createQuizOpen}
        onOpenChange={setCreateQuizOpen}
        onSuccess={loadStudySets}
      />
      <CreateFlashcardsSheet
        open={createFlashcardsOpen}
        onOpenChange={setCreateFlashcardsOpen}
        onSuccess={loadStudySets}
      />
    </div>
  );
}

export default function StudySetsPage() {
  return (
    <ErrorBoundary>
      <StudySetsContent />
    </ErrorBoundary>
  );
}
