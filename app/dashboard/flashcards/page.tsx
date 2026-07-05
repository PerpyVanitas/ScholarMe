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
import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Loader2,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle,
  Users,
  Lock,
  FileText,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

import { ErrorBoundary } from "@/components/error-boundary";

function FlashcardsContent() {
  const [activeTab, setActiveTab] = useState("my-sets");
  const [myStudySets, setMyStudySets] = useState<StudySet[]>([]);
  const [sharedStudySets, setSharedStudySets] = useState<StudySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "flashcard",
    is_public: false,
    content: "",
    source_resource_id: "",
  });
  const [structuredItems, setStructuredItems] = useState<any[]>([]);
  const [targetChapters, setTargetChapters] = useState("");
  const [userContext, setUserContext] = useState("");

  const [resources, setResources] = useState<any[]>([]);
  const [selectedResource, setSelectedResource] = useState("");
  const [extractedTopics, setExtractedTopics] = useState<string[]>([]);
  const [extractingTopics, setExtractingTopics] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [creationMethod, setCreationMethod] = useState("manual");

  const loadResources = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("resources")
      .select("id, title")
      .order("created_at", { ascending: false });
    if (data) setResources(data);
  };

  useEffect(() => {
    loadStudySets();
    loadResources();
  }, []);

  useEffect(() => {
    async function extractTopics(resourceId: string) {
      setExtractingTopics(true);
      try {
        const res = await fetch("/api/resources/extract-topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resource_id: resourceId }),
        });
        const data = await res.json();
        if (data.topics) {
          setExtractedTopics(data.topics);
          setSelectedTopics([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setExtractingTopics(false);
      }
    }
    if (selectedResource) {
      extractTopics(selectedResource);
    } else {
      setExtractedTopics([]);
      setSelectedTopics([]);
    }
  }, [selectedResource]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

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

  const handleGenerateQuiz = async () => {
    if (!aiPrompt) {
      toast.error("Please enter a topic to generate questions about");
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiPrompt,
          type: "flashcard",
          count: aiCount,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate questions");
      }

      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        const newContent = data.data
          .map((item: any) => `Q: ${item.question}\nA: ${item.answer}`)
          .join("\n\n");

        setFormData((prev) => ({
          ...prev,
          content: prev.content
            ? prev.content + "\n\n" + newContent
            : newContent,
        }));

        toast.success("Questions generated successfully!");
        setCreationMethod("manual");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate questions",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFromResource = async () => {
    if (!selectedResource) return;
    try {
      setGenerating(true);
      const res = await fetch("/api/quizzes/generate-from-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_id: selectedResource,
          config: {
            user_context: userContext,
            target_chapters:
              selectedTopics.length > 0
                ? selectedTopics.join(", ")
                : targetChapters,
            generate_flashcards: true,
            generate_quiz: false,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate from resource");
      }

      const { data } = await res.json();
      const items = data.flashcards;

      if (items && Array.isArray(items)) {
        setStructuredItems(items);
        setFormData((prev) => ({
          ...prev,
          source_resource_id: selectedResource,
          type: "flashcard",
        }));
        toast.success("Content generated successfully from resource!");
      } else {
        toast.error("No flashcards found in the generated response.");
      }
    } catch (error) {
      console.error("Error generating from resource:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error("Please fill in title and content");
      return;
    }

    try {
      setCreating(true);

      let items: any[] = [];

      if (structuredItems.length > 0) {
        items = structuredItems.map((item) => ({
          question: item.front,
          answer: item.back,
          item_type: "flashcard",
        }));
      } else {
        const lines = formData.content
          .split("\n")
          .filter((line) => line.trim());
        items = lines
          .map((line) => {
            const match = line.match(/Q:\s*(.+?)\s+A:\s*(.+)/i);
            if (match) {
              return {
                question: match[1].trim(),
                answer: match[2].trim(),
                item_type: "flashcard",
              };
            }
            return null;
          })
          .filter(Boolean);
      }

      if (items.length === 0) {
        toast.error("Please add at least one flashcard");
        setCreating(false);
        return;
      }

      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          is_public: formData.is_public,
          source_type: formData.source_resource_id ? "resource" : "manual",
          source_resource_id: formData.source_resource_id || undefined,
          items,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create flashcards");
      }

      toast.success("Flashcards created!");
      setFormData({
        title: "",
        description: "",
        type: "flashcard",
        is_public: false,
        content: "",
        source_resource_id: "",
      });
      setStructuredItems([]);
      setUserContext("");
      setTargetChapters("");
      setDialogOpen(false);
      await loadStudySets();
    } catch (error) {
      console.error("Error creating flashcards:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create flashcards",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm("Are you sure you want to delete these flashcards?")) return;

    try {
      const res = await fetch(`/api/flashcards/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Flashcards deleted");
      await loadStudySets();
    } catch (error) {
      console.error("Error deleting flashcards:", error);
      toast.error("Failed to delete flashcards");
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
                    <Button asChild className="w-full mt-auto">
                      <Link href={`/dashboard/flashcards/study/${set.id}`}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Study
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl overflow-y-auto border-l"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">Create New Flashcards</SheetTitle>
            <SheetDescription>
              Create a new flashcard set manually or generate one with AI.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreateQuiz} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g., Biology Chapter 3"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  disabled={creating}
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  placeholder="What is this study set about?"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={creating}
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="flex items-center gap-3 pt-1">
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_public: checked })
                    }
                    disabled={creating}
                  />
                  <span className="text-sm font-medium">
                    {formData.is_public ? "Public" : "Private (Only You)"}
                  </span>
                </div>
              </div>
            </div>

            <Tabs
              value={creationMethod}
              onValueChange={setCreationMethod}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full bg-muted/50 p-1 rounded-lg">
                <TabsTrigger
                  value="manual"
                  className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Manual
                </TabsTrigger>
                <TabsTrigger
                  value="ai"
                  className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" /> AI Generate
                </TabsTrigger>
                <TabsTrigger
                  value="resource"
                  className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> From Resource
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-2 mt-4">
                <Label>Flashcards</Label>
                <p className="text-xs text-muted-foreground">
                  Format: Q: question text A: answer text (one per line)
                </p>
                <Textarea
                  placeholder="Q: What is the capital of France? A: Paris"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  disabled={creating}
                  rows={6}
                />
              </TabsContent>

              <TabsContent value="ai" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>What should the flashcards be about?</Label>
                  <Textarea
                    placeholder="e.g. The history of the Roman Empire, focusing on Julius Caesar"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={generating}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Number of flashcards</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={aiCount}
                    onChange={(e) => setAiCount(parseInt(e.target.value) || 5)}
                    disabled={generating}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleGenerateQuiz}
                  disabled={generating || !aiPrompt}
                  className="w-full"
                  variant="secondary"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Generating...
                    </>
                  ) : (
                    "Generate Flashcards"
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="resource" className="space-y-5 mt-4">
                {structuredItems.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/50 pb-3">
                      <div>
                        <Label className="text-base font-semibold">
                          Generated Preview
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {structuredItems.length} flashcards ready to save.
                          Edit inline below.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setStructuredItems([])}
                        className="h-8"
                      >
                        Discard
                      </Button>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                      {structuredItems.map((item, i) => (
                        <div
                          key={i}
                          className="p-4 bg-muted/30 border border-border/50 rounded-xl text-sm relative group focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all"
                        >
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1 block">
                                Front (Question)
                              </Label>
                              <Textarea
                                value={item.question || item.front || ""}
                                onChange={(e) => {
                                  const newItems = [...structuredItems];
                                  if (newItems[i].question !== undefined)
                                    newItems[i].question = e.target.value;
                                  else if (newItems[i].front !== undefined)
                                    newItems[i].front = e.target.value;
                                  setStructuredItems(newItems);
                                }}
                                className="min-h-[60px] text-sm resize-none bg-background border-none shadow-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                                placeholder="Front text..."
                              />
                            </div>

                            <div className="pt-2 border-t border-border/50">
                              <Label className="text-xs text-muted-foreground mb-1 block">
                                Back (Answer)
                              </Label>
                              <Input
                                value={item.answer || item.back || ""}
                                onChange={(e) => {
                                  const newItems = [...structuredItems];
                                  if (newItems[i].answer !== undefined)
                                    newItems[i].answer = e.target.value;
                                  else if (newItems[i].back !== undefined)
                                    newItems[i].back = e.target.value;
                                  setStructuredItems(newItems);
                                }}
                                className="h-8 text-sm font-medium bg-background border-none shadow-none px-0 focus-visible:ring-0"
                                placeholder="Back text..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Select Resource</Label>
                      <Select
                        value={selectedResource}
                        onValueChange={setSelectedResource}
                        disabled={generating}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a document/PDF" />
                        </SelectTrigger>
                        <SelectContent>
                          {resources.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {extractingTopics ? (
                      <div className="flex items-center gap-2 p-4 text-sm text-zinc-400 bg-zinc-900/30 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Scanning document for chapters and topics...
                      </div>
                    ) : extractedTopics.length > 0 ? (
                      <div className="space-y-2">
                        <Label>Select Topics to Include</Label>
                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-2 border border-border/50 rounded-md bg-zinc-950">
                          {extractedTopics.map((topic) => (
                            <div
                              key={topic}
                              className="flex items-start space-x-2"
                            >
                              <input
                                type="checkbox"
                                id={"topic_" + topic}
                                checked={selectedTopics.includes(topic)}
                                onChange={() => toggleTopic(topic)}
                                className="mt-1 rounded border-zinc-700 bg-zinc-900 w-4 h-4 cursor-pointer shrink-0"
                              />
                              <Label
                                htmlFor={"topic_" + topic}
                                className="text-xs cursor-pointer leading-tight"
                              >
                                {topic}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Target Chapters/Topics</Label>
                        <Input
                          placeholder="e.g. Chapter 3, Photosynthesis (Enter manually)"
                          value={targetChapters}
                          onChange={(e) => setTargetChapters(e.target.value)}
                          disabled={generating}
                        />
                      </div>
                    )}
                    <div className="space-y-2 mt-4">
                      <Label>Context / Instructions</Label>
                      <Input
                        placeholder="e.g. Focus on definitions"
                        value={userContext}
                        onChange={(e) => setUserContext(e.target.value)}
                        disabled={generating}
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={handleGenerateFromResource}
                      disabled={generating || !selectedResource}
                      className="w-full mt-2"
                      variant="secondary"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Extracting from Resource...
                        </>
                      ) : (
                        "Generate Flashcards"
                      )}
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <SheetFooter className="pt-6 border-t mt-6 flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={creating}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="w-full sm:w-auto min-w-[140px]"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" /> Create Flashcards
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
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
