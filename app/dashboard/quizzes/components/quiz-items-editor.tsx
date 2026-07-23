import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { ImageOcclusionEditor } from "@/features/quizzes/components/image-occlusion-editor";

export interface QuizItemPreview {
  question?: string;
  instructions?: string;
  answer?: string;
  correct_answer?: string;
  type?: string;
  image_url?: string;
  occlusion_masks?: Array<{ id: string; x: number; y: number; width: number; height: number }>;
}

interface QuizItemsEditorProps {
  structuredItems: Record<string, unknown>[];
  setStructuredItems: React.Dispatch<
    React.SetStateAction<Record<string, unknown>[]>
  >;
  formData: { type: string };
}

export function QuizItemsEditor({
  structuredItems,
  setStructuredItems,
  formData,
}: QuizItemsEditorProps) {
  if (structuredItems.length === 0) return null;

  const items = structuredItems as unknown as QuizItemPreview[];

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div>
          <Label className="text-base font-semibold">Generated Preview</Label>
          <p className="text-xs text-muted-foreground">
            {structuredItems.length} items ready to save. Edit inline below.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setStructuredItems([
                ...structuredItems,
                {
                  question: "",
                  answer: "",
                  type: "flashcard",
                  image_url: "",
                  occlusion_masks: [],
                },
              ])
            }
            className="h-8"
          >
            Add Item
          </Button>
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
      </div>
      <div className="max-h-[600px] overflow-y-auto space-y-4 pr-2 scrollbar-thin">
        {items.map((item, i) => (
          <div
            key={i}
            className="p-4 bg-muted/30 border border-border/50 rounded-xl text-sm relative group focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all"
          >
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                variant="destructive"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  const newItems = [...structuredItems];
                  newItems.splice(i, 1);
                  setStructuredItems(newItems);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Badge
                variant="outline"
                className="text-[10px] uppercase bg-background"
              >
                {item.type?.replace(/_/g, " ") || formData.type}
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Question
                </Label>
                <Textarea
                  value={item.question || item.instructions || ""}
                  onChange={(e) => {
                    const newItems = [...structuredItems];
                    const target = newItems[i] as QuizItemPreview;
                    if (target.question !== undefined)
                      target.question = e.target.value;
                    else if (target.instructions !== undefined)
                      target.instructions = e.target.value;
                    else target.question = e.target.value;
                    setStructuredItems(newItems);
                  }}
                  className="min-h-[40px] text-sm resize-none bg-background border-none shadow-none px-2 py-2 focus-visible:ring-1"
                  placeholder="Question text..."
                />
              </div>

              <div className="pt-2 border-t border-border/50">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Answer
                </Label>
                <Input
                  value={item.correct_answer || item.answer || ""}
                  onChange={(e) => {
                    const newItems = [...structuredItems];
                    const target = newItems[i] as QuizItemPreview;
                    if (target.correct_answer !== undefined)
                      target.correct_answer = e.target.value;
                    else if (target.answer !== undefined)
                      target.answer = e.target.value;
                    else target.answer = e.target.value;
                    setStructuredItems(newItems);
                  }}
                  className="h-8 text-sm font-medium bg-background border-none shadow-none px-2 focus-visible:ring-1"
                  placeholder="Answer text..."
                />
              </div>

              <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground block">
                  Image URL (Optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/image.png"
                    className="h-8 text-xs"
                    value={item.image_url || ""}
                    onChange={(e) => {
                      const newItems = [...structuredItems];
                      (newItems[i] as QuizItemPreview).image_url = e.target.value;
                      setStructuredItems(newItems);
                    }}
                  />
                </div>
                {item.image_url && (
                  <ImageOcclusionEditor
                    imageUrl={item.image_url}
                    masks={(item.occlusion_masks as unknown as Array<{ id: string; x: number; y: number; width: number; height: number }>) || []}
                    onChange={(masks) => {
                      const newItems = [...structuredItems];
                      (newItems[i] as QuizItemPreview).occlusion_masks = masks as unknown as Array<{ id: string; x: number; y: number; width: number; height: number }>;
                      setStructuredItems(newItems);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
