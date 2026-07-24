import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface StructuredFlashcardItem {
  front?: string;
  question?: string;
  back?: string;
  answer?: string;
}

interface FlashcardItemsEditorProps {
  structuredItems: StructuredFlashcardItem[];
  setStructuredItems: (items: StructuredFlashcardItem[]) => void;
}

export function FlashcardItemsEditor({
  structuredItems,
  setStructuredItems,
}: FlashcardItemsEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div>
          <Label className="text-base font-semibold">
            Generated Preview
          </Label>
          <p className="text-xs text-muted-foreground">
            {structuredItems.length} flashcards ready to save. Edit inline
            below.
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
  );
}
