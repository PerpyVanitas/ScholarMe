"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Sparkles,
  BookOpen,
  CheckCircle,
  FileText,
  Import,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  StudySetItemsEditor,
  StructuredStudySetItem,
} from "./study-set-items-editor";

interface Resource {
  id: string;
  title: string;
  type: string;
}

interface CreateStudySetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "flashcard" | "multiple_choice" | "mixed";
  onSuccess?: () => void;
}

export function CreateStudySetSheet({
  open,
  onOpenChange,
  defaultType = "flashcard",
  onSuccess,
}: CreateStudySetSheetProps) {
  const router = useRouter();
  const supabase = createClient();

  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creationMethod, setCreationMethod] = useState<"manual" | "ai" | "resource">(
    "manual",
  );

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: defaultType,
    is_public: false,
    source_type: "manual" as string | null,
    source_resource_id: null as string | null,
  });

  const [structuredItems, setStructuredItems] = useState<
    StructuredStudySetItem[]
  >([]);

  // AI Form state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiType, setAiType] = useState<string>(defaultType);
  const [aiCount, setAiCount] = useState<string>("10");

  // Resource Form State
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string>("");

  useEffect(() => {
    if (open) {
      loadResources();
    }
  }, [open]);

  async function loadResources() {
    try {
      setLoadingResources(true);
      const { data } = await supabase
        .from("resources")
        .select("id, title, type")
        .order("created_at", { ascending: false });
      if (data) setResources(data);
    } catch (err) {
      console.error("Error loading resources:", err);
    } finally {
      setLoadingResources(false);
    }
  }

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a topic or prompt for AI generation");
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch("/api/v1/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiPrompt,
          type: aiType,
          count: parseInt(aiCount, 10) || 10,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate content");
      }

      const { data } = await res.json();
      if (data && Array.isArray(data)) {
        const items = data.map((item: Partial<StructuredStudySetItem>) => ({
          question: item.question || item.front || "",
          answer: item.answer || item.back || item.correct_answer || "",
          type: item.type || (aiType === "mixed" ? "multiple_choice" : aiType),
          options: item.options || [],
        }));
        setStructuredItems(items);
        setFormData((prev) => ({
          ...prev,
          title: prev.title || aiPrompt,
          source_type: "ai_generated",
        }));
        toast.success(`Generated ${items.length} items successfully!`);
        setCreationMethod("manual");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate items",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFromResource = async () => {
    if (!selectedResource) {
      toast.error("Please select a resource");
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch("/api/v1/quizzes/generate-from-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource_id: selectedResource }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate from resource");
      }

      const { data } = await res.json();
      if (data && Array.isArray(data)) {
        const items = data.map((item: Partial<StructuredStudySetItem>) => ({
          question: item.question || item.front || "",
          answer: item.answer || item.back || item.correct_answer || "",
          type: defaultType,
        }));
        setStructuredItems(items);
        setFormData((prev) => ({
          ...prev,
          source_type: "resource",
          source_resource_id: selectedResource,
        }));
        toast.success(
          `Extracted ${items.length} items from resource successfully!`,
        );
        setCreationMethod("manual");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to extract from resource",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateStudySet = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a title for your Study Set");
      return;
    }

    if (structuredItems.length === 0) {
      toast.error("Please add at least one term and definition card");
      return;
    }

    const invalidItem = structuredItems.find(
      (item) =>
        !(item.question || item.front || item.instructions)?.trim() ||
        !(item.answer || item.back || item.correct_answer)?.trim(),
    );

    if (invalidItem) {
      toast.error("All study set cards must have both a question/term and an answer/definition");
      return;
    }

    try {
      setCreating(true);

      const itemsToSubmit = structuredItems.map((item) => ({
        question: (item.question || item.front || item.instructions || "").trim(),
        answer: (item.answer || item.back || item.correct_answer || "").trim(),
        options: item.options || null,
        item_type: item.type || item.item_type || formData.type,
      }));

      const res = await fetch("/api/v1/quizzes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          type: formData.type,
          is_public: formData.is_public,
          source_type: formData.source_type,
          source_resource_id: formData.source_resource_id,
          items: itemsToSubmit,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save study set");
      }

      toast.success("Study Set created successfully!");
      onOpenChange(false);
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create study set",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Create Study Set</SheetTitle>
          <SheetDescription>
            Create terms & definitions once. Study them as Flashcards, Tests, or Learn mode anytime.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleCreateStudySet} className="space-y-6 mt-4">
          {/* Metadata Section */}
          <div className="space-y-4 p-4 bg-muted/20 border border-border/50 rounded-xl">
            <div className="space-y-1.5">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Organic Chemistry — Functional Groups"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="bg-background"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Brief description of what this study set covers..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-[60px] text-xs bg-background resize-none"
              />
            </div>
          </div>

          {/* Creation Method Tabs */}
          <Tabs
            value={creationMethod}
            onValueChange={(val) =>
              setCreationMethod(val as "manual" | "ai" | "resource")
            }
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="manual" className="text-xs flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> Manual & Paste
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Generate
              </TabsTrigger>
              <TabsTrigger value="resource" className="text-xs flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> From Resource
              </TabsTrigger>
            </TabsList>

            {/* Manual Entry & Bulk Paste Tab */}
            <TabsContent value="manual" className="space-y-4 pt-2">
              <StudySetItemsEditor
                structuredItems={structuredItems}
                setStructuredItems={setStructuredItems}
                defaultType={formData.type}
              />
            </TabsContent>

            {/* AI Generation Tab */}
            <TabsContent value="ai" className="space-y-4 pt-3">
              <div className="p-4 border rounded-xl bg-muted/20 space-y-4">
                <div className="space-y-1.5">
                  <Label>Topic or Study Content Prompt</Label>
                  <Textarea
                    placeholder="e.g. Create 10 cards on Mitosis phases and key cellular organelles..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[90px] text-xs bg-background"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Question Type</Label>
                    <Select value={aiType} onValueChange={setAiType}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flashcard">Flashcards (Term & Def)</SelectItem>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="mixed">Mixed Types</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Number of Cards</Label>
                    <Select value={aiCount} onValueChange={setAiCount}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Cards</SelectItem>
                        <SelectItem value="10">10 Cards</SelectItem>
                        <SelectItem value="15">15 Cards</SelectItem>
                        <SelectItem value="20">20 Cards</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={generating}
                  className="w-full h-9 text-xs"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-3.5 w-3.5 text-primary-foreground" />
                      Generate Study Set Items
                    </>
                  )}
                </Button>
              </div>

              {structuredItems.length > 0 && (
                <StudySetItemsEditor
                  structuredItems={structuredItems}
                  setStructuredItems={setStructuredItems}
                  defaultType={formData.type}
                />
              )}
            </TabsContent>

            {/* Extract From Resource Tab */}
            <TabsContent value="resource" className="space-y-4 pt-3">
              <div className="p-4 border rounded-xl bg-muted/20 space-y-4">
                <div className="space-y-1.5">
                  <Label>Select Library Resource</Label>
                  {loadingResources ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading resources...
                    </div>
                  ) : (
                    <Select
                      value={selectedResource}
                      onValueChange={setSelectedResource}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Choose a document or notes resource..." />
                      </SelectTrigger>
                      <SelectContent>
                        {resources.map((res) => (
                          <SelectItem key={res.id} value={res.id}>
                            {res.title} ({res.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleGenerateFromResource}
                  disabled={generating || !selectedResource}
                  className="w-full h-9 text-xs"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Extracting Key Concepts...
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-3.5 w-3.5" />
                      Extract Terms & Definitions
                    </>
                  )}
                </Button>
              </div>

              {structuredItems.length > 0 && (
                <StudySetItemsEditor
                  structuredItems={structuredItems}
                  setStructuredItems={setStructuredItems}
                  defaultType={formData.type}
                />
              )}
            </TabsContent>
          </Tabs>

          <SheetFooter className="pt-4 border-t flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || structuredItems.length === 0}
              className="h-9 text-xs min-w-[120px]"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-3.5 w-3.5" /> Save Study Set
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
