"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Search,
  Import,
  Sparkles,
  GripVertical,
  ImageIcon,
} from "lucide-react";
import { ImageOcclusionEditor } from "@/features/quizzes/components/image-occlusion-editor";
import { PasteImportDialog, ParsedItem } from "./paste-import-dialog";

export interface StructuredStudySetItem {
  question?: string;
  front?: string;
  answer?: string;
  back?: string;
  correct_answer?: string;
  instructions?: string;
  options?: string[] | null;
  type?: string;
  item_type?: string;
  image_url?: string;
  occlusion_masks?: Array<{ id: string; x: number; y: number; width: number; height: number }> | string[];
}

interface StudySetItemsEditorProps {
  structuredItems: StructuredStudySetItem[];
  setStructuredItems: React.Dispatch<
    React.SetStateAction<StructuredStudySetItem[]>
  >;
  defaultType?: string;
}

export function StudySetItemsEditor({
  structuredItems,
  setStructuredItems,
  defaultType = "flashcard",
}: StudySetItemsEditorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleAddItem = () => {
    setStructuredItems((prev) => [
      ...prev,
      {
        question: "",
        answer: "",
        type: defaultType,
        image_url: "",
        occlusion_masks: [],
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setStructuredItems((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    setStructuredItems((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  const handleBulkImport = (importedItems: ParsedItem[]) => {
    setStructuredItems((prev) => [
      ...prev,
      ...importedItems.map((item) => ({
        question: item.question,
        answer: item.answer,
        type: defaultType,
      })),
    ]);
  };

  const filteredItems = structuredItems.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = item.question || item.front || item.instructions || "";
    const a = item.answer || item.back || item.correct_answer || "";
    return (
      q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-4 mt-4">
      {/* Editor Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Label className="text-base font-semibold">
              Study Set Items ({structuredItems.length})
            </Label>
            {structuredItems.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {structuredItems.filter(
                  (i) =>
                    (i.question || i.front) && (i.answer || i.back),
                ).length}{" "}
                Valid
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Add, edit, reorder, or paste terms and definitions below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            className="h-8 text-xs flex items-center gap-1.5"
          >
            <Import className="h-3.5 w-3.5" />
            Paste / Import
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddItem}
            className="h-8 text-xs flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Card
          </Button>

          {structuredItems.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStructuredItems([])}
              className="h-8 text-xs text-muted-foreground hover:text-destructive"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Filter / Search within large sets */}
      {structuredItems.length > 4 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search within set items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-muted/20"
          />
        </div>
      )}

      {/* Empty State */}
      {structuredItems.length === 0 && (
        <div className="p-8 border border-dashed border-border/80 rounded-xl text-center space-y-3 bg-muted/10">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/60 animate-pulse" />
          <div className="space-y-1">
            <p className="text-sm font-medium">No items in this set yet</p>
            <p className="text-xs text-muted-foreground">
              Add cards manually, generate with AI, or paste from Quizlet.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              className="h-8 text-xs"
            >
              <Import className="mr-1.5 h-3.5 w-3.5" /> Bulk Paste
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddItem}
              className="h-8 text-xs"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Card
            </Button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="max-h-[550px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {filteredItems.map((item, i) => {
          const originalIndex = structuredItems.indexOf(item);
          const isFirst = originalIndex === 0;
          const isLast = originalIndex === structuredItems.length - 1;

          return (
            <div
              key={originalIndex}
              className="p-4 bg-muted/20 border border-border/60 hover:border-border rounded-xl text-sm relative group focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all space-y-3"
            >
              {/* Card Top Actions Bar */}
              <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-2">
                <div className="flex items-center gap-2 font-medium">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                  <span>Card {originalIndex + 1}</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {item.type || item.item_type || defaultType}
                  </Badge>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isFirst}
                    onClick={() => handleMoveItem(originalIndex, "up")}
                    className="h-6 w-6"
                    title="Move Up"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isLast}
                    onClick={() => handleMoveItem(originalIndex, "down")}
                    className="h-6 w-6"
                    title="Move Down"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveItem(originalIndex)}
                    className="h-6 w-6 ml-1"
                    title="Delete Item"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Card Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Term / Question / Front */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Term / Question <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={item.question || item.front || item.instructions || ""}
                    onChange={(e) => {
                      const copy = [...structuredItems];
                      copy[originalIndex].question = e.target.value;
                      copy[originalIndex].front = e.target.value;
                      setStructuredItems(copy);
                    }}
                    placeholder="Enter term or question..."
                    className="min-h-[70px] text-sm resize-none bg-background border-border/60 focus-visible:ring-1"
                  />
                </div>

                {/* Definition / Answer / Back */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Definition / Answer <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={item.answer || item.back || item.correct_answer || ""}
                    onChange={(e) => {
                      const copy = [...structuredItems];
                      copy[originalIndex].answer = e.target.value;
                      copy[originalIndex].back = e.target.value;
                      copy[originalIndex].correct_answer = e.target.value;
                      setStructuredItems(copy);
                    }}
                    placeholder="Enter definition or answer..."
                    className="min-h-[70px] text-sm resize-none bg-background border-border/60 focus-visible:ring-1"
                  />
                </div>
              </div>

              {/* Multiple Choice Options (If presents) */}
              {item.options && item.options.length > 0 && (
                <div className="pt-2 border-t border-border/40">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Distractor Choices
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {item.options.map((opt, optIdx) => (
                      <Input
                        key={optIdx}
                        value={opt}
                        onChange={(e) => {
                          const copy = [...structuredItems];
                          if (copy[originalIndex].options) {
                            copy[originalIndex].options![optIdx] = e.target.value;
                            setStructuredItems(copy);
                          }
                        }}
                        className="h-8 text-xs bg-background border-border/50"
                        placeholder={`Option ${optIdx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Image & Occlusion Support */}
              <div className="pt-2 border-t border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" /> Image URL (Optional)
                  </Label>
                </div>
                <Input
                  type="url"
                  placeholder="https://example.com/image.png"
                  className="h-7 text-xs bg-background"
                  value={item.image_url || ""}
                  onChange={(e) => {
                    const copy = [...structuredItems];
                    copy[originalIndex].image_url = e.target.value;
                    setStructuredItems(copy);
                  }}
                />
                {item.image_url && (
                  <ImageOcclusionEditor
                    imageUrl={item.image_url}
                    masks={(item.occlusion_masks as unknown as Array<{ id: string; x: number; y: number; width: number; height: number }>) || []}
                    onChange={(masks) => {
                      const copy = [...structuredItems];
                      copy[originalIndex].occlusion_masks = masks as unknown as Array<{ id: string; x: number; y: number; width: number; height: number }>;
                      setStructuredItems(copy);
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <PasteImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleBulkImport}
      />
    </div>
  );
}
