"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Loader2, CheckCircle, BookOpen, FileText } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { CreateMLCEngine } from "@mlc-ai/web-llm";

interface CreateFlashcardsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateFlashcardsSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateFlashcardsSheetProps) {
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "flashcard",
    is_public: false,
    content: "",
    source_resource_id: "",
  });

  const [structuredItems, setStructuredItems] = useState<Record<string, any>[]>(
    [],
  );
  const [targetChapters, setTargetChapters] = useState("");
  const [userContext, setUserContext] = useState("");

  const [resources, setResources] = useState<{ id: string; title: string }[]>(
    [],
  );
  const [selectedResource, setSelectedResource] = useState("");
  const [extractedTopics, setExtractedTopics] = useState<string[]>([]);
  const [extractingTopics, setExtractingTopics] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [creationMethod, setCreationMethod] = useState("manual");
  const [useLocalAI, setUseLocalAI] = useState(false);
  const [localAIProgress, setLocalAIProgress] = useState("");

  useEffect(() => {
    if (open) {
      loadResources();
    }
  }, [open]);

  const loadResources = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("resources")
      .select("id, title")
      .order("created_at", { ascending: false });
    if (data) setResources(data);
  };

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

  const handleGenerateQuiz = async () => {
    if (!aiPrompt) {
      toast.error("Please enter a topic to generate questions about");
      return;
    }

    try {
      setGenerating(true);

      if (useLocalAI) {
        setLocalAIProgress("Loading model... (This may take a minute)");
        const engine = await CreateMLCEngine(
          "Llama-3.2-1B-Instruct-q4f32_1-MLC",
          {
            initProgressCallback: (progress) => {
              setLocalAIProgress(
                `Loading Local AI: ${Math.round(progress.progress * 100)}%`,
              );
            },
          },
        );

        setLocalAIProgress("Generating flashcards...");
        const systemPrompt = `You are an expert flashcard generator. Given a topic, generate ${aiCount} flashcards. 
Respond ONLY with a valid JSON array of objects, where each object has a "question" string and an "answer" string.
No other text, markdown blocks, or explanations. Just the JSON array.`;

        const reply = await engine.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Topic: ${aiPrompt}` },
          ],
          response_format: { type: "json_object" },
        });

        const rawContent = reply.choices[0]?.message.content || "[]";
        let parsedData = [];
        try {
          parsedData = JSON.parse(rawContent);
        } catch (e) {
          // Fallback if the model wrapped it in markdown
          const match = rawContent.match(/\[[\s\S]*\]/);
          if (match) {
            parsedData = JSON.parse(match[0]);
          } else {
            throw new Error("Failed to parse JSON from Local AI");
          }
        }

        const newContent = parsedData
          .map((item: any) => `Q: ${item.question}\nA: ${item.answer}`)
          .join("\n\n");

        setFormData((prev) => ({
          ...prev,
          content: prev.content
            ? prev.content + "\n\n" + newContent
            : newContent,
        }));
        toast.success("Questions generated locally successfully!");
        setCreationMethod("manual");
        setLocalAIProgress("");
      } else {
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
            .map(
              (item: Record<string, string>) =>
                `Q: ${item.question}\nA: ${item.answer}`,
            )
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
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate questions",
      );
      setLocalAIProgress("");
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoTag = async () => {
    if (!formData.content) {
      toast.error("Please add some flashcards first before auto-tagging.");
      return;
    }

    try {
      setTagging(true);
      setLocalAIProgress("Loading model for auto-tagging...");
      const engine = await CreateMLCEngine(
        "Llama-3.2-1B-Instruct-q4f32_1-MLC",
        {
          initProgressCallback: (progress) => {
            setLocalAIProgress(
              `Loading Local AI: ${Math.round(progress.progress * 100)}%`,
            );
          },
        },
      );

      setLocalAIProgress("Analyzing flashcards...");
      const systemPrompt = `You are a helpful assistant. Analyze the provided flashcards and output exactly 3 comma-separated tags (e.g. "Biology, Anatomy, Cells"). Do not output anything else.`;

      const reply = await engine.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Flashcards: ${formData.content}` },
        ],
      });

      const generatedTags = reply.choices[0]?.message.content?.trim() || "";
      if (generatedTags) {
        setFormData((prev) => ({
          ...prev,
          description: prev.description
            ? `${prev.description} | Tags: ${generatedTags}`
            : `Tags: ${generatedTags}`,
        }));
        toast.success(
          "Tags successfully generated and appended to description!",
        );
      }
    } catch (error) {
      console.error("Error auto-tagging:", error);
      toast.error("Failed to generate tags with AI.");
    } finally {
      setTagging(false);
      setLocalAIProgress("");
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

    if (
      !formData.title ||
      (!formData.content && structuredItems.length === 0)
    ) {
      toast.error("Please fill in title and content");
      return;
    }

    try {
      setCreating(true);

      let items: Record<string, string>[] = [];

      if (structuredItems.length > 0) {
        items = structuredItems.map((item) => ({
          question: item.front || item.question,
          answer: item.back || item.answer,
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
          .filter(Boolean) as Record<string, string>[];
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
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating flashcards:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create flashcards",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
              <div className="flex items-center justify-between">
                <Label>Description (optional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-primary"
                  onClick={handleAutoTag}
                  disabled={tagging || !formData.content}
                >
                  {tagging ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : null}
                  Auto-Tag with AI
                </Button>
              </div>
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
              <div className="flex items-center justify-between">
                <Label>Flashcards</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      content:
                        "Q: What is the powerhouse of the cell?\nA: Mitochondria\n\nQ: What is the chemical symbol for Gold?\nA: Au\n\nQ: What year did the Titanic sink?\nA: 1912",
                    })
                  }
                >
                  Load Template
                </Button>
              </div>
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
              <div className="flex items-center space-x-2 border rounded-md p-4 bg-muted/20">
                <Switch
                  id="local-ai-mode"
                  checked={useLocalAI}
                  onCheckedChange={setUseLocalAI}
                />
                <Label
                  htmlFor="local-ai-mode"
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium text-primary">
                    Use Local AI (Free, Unlimited)
                  </div>
                  <div className="text-xs text-muted-foreground font-normal leading-tight">
                    Generates flashcards directly on your device using WebGPU.
                    Saves API costs and bypasses rate limits. First run
                    downloads a ~1GB model.
                  </div>
                </Label>
              </div>

              <Button
                onClick={handleGenerateQuiz}
                disabled={generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {localAIProgress ? localAIProgress : "Generating..."}
                  </>
                ) : (
                  "Generate Questions"
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
                        {structuredItems.length} flashcards ready to save. Edit
                        inline below.
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
                    <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground bg-muted/50 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning document for chapters and topics...
                    </div>
                  ) : extractedTopics.length > 0 ? (
                    <div className="space-y-2">
                      <Label>Select Topics to Include</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-2 border border-border/50 rounded-md bg-muted/50">
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
                        placeholder="e.g. Chapter 3"
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
                        Extracting...
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
              onClick={() => onOpenChange(false)}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
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
  );
}
