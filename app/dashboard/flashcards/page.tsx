"use client";

import { useState, useEffect } from "react";
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
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ErrorBoundary } from "@/components/error-boundary";
import dynamic from "next/dynamic";

const CreateFlashcardsSheet = dynamic(
  () =>
    import("./components/create-flashcards-sheet").then(
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

function FlashcardsContent() {
  const [activeTab, setActiveTab] = useState("my-sets");
  const [myStudySets, setMyStudySets] = useState<StudySet[]>([]);
  const [sharedStudySets, setSharedStudySets] = useState<StudySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadStudySets();
  }, []);

  const loadStudySets = async () => {
    try {
      setLoading(true);
      const [myRes, sharedRes] = await Promise.all([
        fetch("/api/flashcards/my-sets"),
        fetch("/api/flashcards/shared"),
      ]);

      if (myRes.ok) {
        const myData = await myRes.json();
        setMyStudySets(myData.data || []);
      }

      if (sharedRes.ok) {
        const sharedData = await sharedRes.json();
        setSharedStudySets(sharedData.data || []);
      }
    } catch (error) {
      console.error("Error loading flashcards:", error);
      toast.error("Failed to load flashcards");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = (id: string) => {
    const setToDelete = myStudySets.find((s) => s.id === id);
    if (!setToDelete) return;

    // Optimistically remove from UI
    setMyStudySets((prev) => prev.filter((s) => s.id !== id));

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/flashcards/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete");
      } catch (error) {
        console.error("Error deleting flashcards:", error);
        toast.error("Failed to delete flashcards");
        await loadStudySets(); // Revert on failure
      }
    }, 5000);

    toast.success("Flashcard set deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          clearTimeout(timeoutId);
          setMyStudySets((prev) => {
            const restored = [...prev, setToDelete];
            // Sort by created_at descending to maintain order
            return restored.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            );
          });
          toast.success("Delete undone");
        },
      },
      duration: 5000,
    });
  };

  const handleForkSet = async (id: string) => {
    try {
      toast.loading("Forking set...", { id: "forking" });
      const res = await fetch(`/api/flashcards/${id}/fork`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to fork");

      toast.success("Set forked to your personal flashcards!", {
        id: "forking",
      });
      await loadStudySets();
      setActiveTab("my-sets");
    } catch (error) {
      console.error("Error forking:", error);
      toast.error("Failed to fork set", { id: "forking" });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "flashcard":
        return "Flashcards";
      case "multiple_choice":
        return "Multiple Choice";
      case "true_false":
        return "True/False";
      case "mixed":
        return "Mixed";
      default:
        return type;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Flashcards
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage your flashcard sets
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Flashcards
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="my-sets" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            My Flashcards
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Shared Sets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-sets">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : myStudySets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-center text-muted-foreground">
                  No flashcards yet. Create your first one!
                </p>
                <Button
                  onClick={() => setDialogOpen(true)}
                  className="gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Create Flashcards
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myStudySets.map((set) => (
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
                      <Badge variant="secondary">
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
                      <span className="flex items-center gap-1">
                        {set.is_public ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                        {set.is_public ? "Public" : "Private"}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Button asChild className="flex-1">
                        <Link href={`/dashboard/flashcards/study/${set.id}`}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Study
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteQuiz(set.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : sharedStudySets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-center text-muted-foreground">
                  No shared flashcards available yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedStudySets.map((set) => (
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
                      <Badge variant="secondary">
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
                      <span>by {set.profiles?.full_name || "Unknown"}</span>
                    </div>
                    <div className="flex gap-2 mt-auto w-full">
                      <Button asChild className="flex-1">
                        <Link href={`/dashboard/flashcards/study/${set.id}`}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Study
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Fork to My Sets"
                        onClick={() => handleForkSet(set.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateFlashcardsSheet
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadStudySets}
      />
    </div>
  );
}

export default function FlashcardsPage() {
  return (
    <ErrorBoundary>
      <FlashcardsContent />
    </ErrorBoundary>
  );
}
