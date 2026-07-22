"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Loader2, CheckCircle, BookOpen, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useWebLLM } from "@/hooks/use-webllm";
import { QuizConfigPanel } from "./quiz-config-panel";
import { QuizItemsEditor } from "./quiz-items-editor";

interface CreateQuizSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateQuizSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateQuizSheetProps) {
  const { initializeEngine } = useWebLLM();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "mixed" as const,
    is_public: false,
    content: "",
    source_resource_id: "",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [structuredItems, setStructuredItems] = useState<Record<string, any>[]>(
    [],
  );
  const [targetChapters, setTargetChapters] = useState("");
  const [userContext, setUserContext] = useState("");
  const [quizConfig, setQuizConfig] = useState({
    multiple_choice: { enabled: true, count: 5, choices: 4 },
    true_false: { enabled: true, count: 5 },
    matching_type: { enabled: false, count: 5 },
    modified_true_false: { enabled: false, count: 5 },
    identification: { enabled: false, count: 5 },
    fill_in_the_blanks: { enabled: false, count: 5 },
  });

  const [resources, setResources] = useState<{ id: string; title: string }[]>(
    [],
  );
  const [selectedResource, setSelectedResource] = useState("");
  const [extractedTopics, setExtractedTopics] = useState<string[]>([]);
  const [extractingTopics, setExtractingTopics] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [creationMethod, setCreationMethod] = useState("manual");
  const [localAIProgressText, setLocalAIProgressText] = useState("");
  const [localAIProgressValue, setLocalAIProgressValue] = useState(0);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!cooldownEnd) return;
    const interval = setInterval(() => {
      const remain = Math.ceil((cooldownEnd - Date.now()) / 1000);
      if (remain <= 0) {
        setTimeLeft(0);
        setCooldownEnd(null);
        clearInterval(interval);
      } else {
        setTimeLeft(remain);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

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
        toast.error(e instanceof Error ? e.message : "An error occurred");
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

      const enabledTypes = Object.entries(quizConfig).filter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, conf]) => conf.enabled,
      );
      const derivedType =
        enabledTypes.length === 1 ? enabledTypes[0][0] : "mixed";
      const totalCount =
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        enabledTypes.reduce((acc, [_, conf]) => acc + conf.count, 0) || aiCount;

      setLocalAIProgressText("Loading model... (This may take a minute)");
      setLocalAIProgressValue(0);

      const engine = await initializeEngine();
      if (!engine) {
        throw new Error("Failed to initialize AI engine");
      }

      setLocalAIProgressText("Generating quiz...");
      setLocalAIProgressValue(100);
      const systemPrompt = `You are an expert quiz generator. Given a topic, generate ${totalCount} questions.
The types of questions are: ${enabledTypes.map((t) => t[0]).join(", ")}.
Respond ONLY with a valid JSON array of objects.
Each object must have:
"question": string
"answer": string
"options": array of strings (if multiple choice)
"item_type": string (one of the question types)
No other text, markdown blocks, or explanations. Just the JSON array.`;

      const reply = (await (engine as unknown as { chat: { completions: { create: (opts: Record<string, unknown>) => Promise<unknown> } } }).chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Topic: ${aiPrompt}` },
        ],
        response_format: { type: "json_object" },
      })) as { choices: { message: { content?: string } }[] };

      const rawContent = reply.choices[0]?.message?.content || "[]";
      let parsedData = [];
      try {
        parsedData = JSON.parse(rawContent);
      } catch (e) {
        const match = rawContent.match(/\[[\s\S]*\]/);
        if (match) {
          parsedData = JSON.parse(match[0]);
        } else {
          throw new Error("Failed to parse JSON from Local AI");
        }
      }

      const newContent = parsedData
        .map((item: { question?: string; answer?: string }) => `Q: ${item.question}\nA: ${item.answer}`)
        .join("\n\n");

      setFormData((prev) => ({
        ...prev,
        content: prev.content ? prev.content + "\n\n" + newContent : newContent,
      }));

      toast.success("Questions generated locally successfully!");
      setCreationMethod("manual");
      setLocalAIProgressText("");
      setLocalAIProgressValue(0);
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate questions",
      );
      setLocalAIProgressText("");
      setLocalAIProgressValue(0);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFromResource = async () => {
    if (!selectedResource) return;
    try {
      setGenerating(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const question_types: Record<string, any> = {};
      Object.entries(quizConfig).forEach(([key, val]) => {
        if (val.enabled) {
          question_types[key] = {
            enabled: true,
            question_count: val.count,
            ...(key === "multiple_choice"
              ? { choices_per_question: (val as { choices: number }).choices }
              : {}),
          };
        }
      });

      if (Object.keys(question_types).length === 0) {
        toast.error("Please enable at least one question type");
        setGenerating(false);
        return;
      }

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
            generate_flashcards: false,
            generate_quiz: true,
            question_types,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 429 && errorData.retryAfter) {
          setCooldownEnd(errorData.retryAfter);
        }
        throw new Error(errorData.error || "Failed to generate from resource");
      }

      const { data } = await res.json();
      const items = data.questions;

      if (items && Array.isArray(items)) {
        setStructuredItems(items);
        setFormData((prev) => ({
          ...prev,
          source_resource_id: selectedResource,
          type: "mixed",
        }));
        toast.success("Content generated successfully from resource!");
      } else {
        toast.error("No questions found in the generated response.");
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let items: Record<string, any>[] = [];

      if (structuredItems.length > 0) {
        items = structuredItems.map((item) => ({
          question: item.question || item.instructions || "Matching Type",
          answer:
            item.correct_answer ||
            item.answer ||
            item.back ||
            JSON.stringify(item.correct_matches || []),
          options:
            item.choices?.map((c: { text: string }) => c.text) ||
            item.accepted_answers ||
            item.responses ||
            null,
          item_type: item.type || formData.type,
          image_url: item.image_url,
          occlusion_masks: item.occlusion_masks,
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
                item_type: formData.type,
              };
            }
            return null;
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter(Boolean) as Record<string, any>[];
      }

      if (items.length === 0) {
        toast.error("Please add at least one question");
        setCreating(false);
        return;
      }

      const res = await fetch("/api/quizzes/create", {
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
        throw new Error(errorData.error || "Failed to create study set");
      }

      toast.success("Study set created!");

      const { earnXp } = await import("@/lib/utils/gamification");
      const xpData = await earnXp("QUIZ_CREATED", "Created Quiz");
      if (xpData.success) {
        toast.success(`🎉 +25 XP Earned!`, {
          description: xpData.current_level
            ? `You are now Level ${xpData.current_level}`
            : "Keep building your knowledge base!",
        });
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        type: "mixed",
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
      console.error("Error creating study set:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create study set",
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
          <SheetTitle className="text-xl">Create New Study Set</SheetTitle>
          <SheetDescription>Add flashcards or quiz questions</SheetDescription>
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

          <QuizConfigPanel
            quizConfig={quizConfig}
            setQuizConfig={setQuizConfig}
            generating={generating}
            creating={creating}
          />

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

            {structuredItems.length > 0 && (
              <QuizItemsEditor
                structuredItems={structuredItems}
                setStructuredItems={setStructuredItems}
                formData={formData}
              />
            )}

            <div className={structuredItems.length > 0 ? "hidden" : "block"}>
              <TabsContent value="manual" className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <Label>Questions</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        content:
                          "Q: What is the capital of France?\nA: Paris\n\nQ: What is 2+2?\nA: 4\n\nQ: What is the largest planet in our solar system?\nA: Jupiter",
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
                  placeholder="Q: What is the capital of France? A: Paris&#10;Q: What is 2+2? A: 4"
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
                  <Label>Topic</Label>
                  <Textarea
                    placeholder="e.g. The history of the Roman Empire"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={generating}
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-4 bg-muted/20">
                  <Label className="flex-1">
                    <div className="font-medium text-primary">
                      Powered by Local AI
                    </div>
                    <div className="text-xs text-muted-foreground font-normal leading-tight">
                      Generates quizzes securely and directly on your device.
                    </div>
                  </Label>
                </div>

                <Button
                  type="button"
                  onClick={handleGenerateQuiz}
                  disabled={generating || !aiPrompt}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      {localAIProgressText ? "Generating..." : "Generating..."}
                    </>
                  ) : (
                    "Generate Questions"
                  )}
                </Button>

                {generating && localAIProgressText && (
                  <div className="space-y-2 mt-4 border p-4 rounded-lg bg-muted/20">
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span className="truncate pr-4">
                        {localAIProgressText}
                      </span>
                      <span>{localAIProgressValue}%</span>
                    </div>
                    <Progress value={localAIProgressValue} className="h-2" />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="resource" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Resource</Label>
                  <Select
                    value={selectedResource}
                    onValueChange={setSelectedResource}
                    disabled={generating || timeLeft > 0}
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
                        <div key={topic} className="flex items-start space-x-2">
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
                      disabled={generating || timeLeft > 0}
                    />
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  <Label>Context / Instructions</Label>
                  <Input
                    placeholder="e.g. Focus on definitions"
                    value={userContext}
                    onChange={(e) => setUserContext(e.target.value)}
                    disabled={generating || timeLeft > 0}
                  />
                </div>

                {timeLeft > 0 ? (
                  <div className="text-center p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 mt-4">
                    Rate limit reached. Please wait {timeLeft}s before
                    generating again.
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={handleGenerateFromResource}
                    disabled={generating || !selectedResource || timeLeft > 0}
                    className="w-full mt-4"
                    variant="secondary"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Generating...
                      </>
                    ) : (
                      "Generate Quiz"
                    )}
                  </Button>
                )}
              </TabsContent>
            </div>
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
                  <CheckCircle className="mr-2 h-4 w-4" /> Create Quiz
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
