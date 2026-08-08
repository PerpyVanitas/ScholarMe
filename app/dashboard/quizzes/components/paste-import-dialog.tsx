"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Import } from "lucide-react";
import { toast } from "sonner";

export interface ParsedItem {
  question: string;
  answer: string;
  type?: string;
}

interface PasteImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: ParsedItem[]) => void;
}

export function PasteImportDialog({
  open,
  onOpenChange,
  onImport,
}: PasteImportDialogProps) {
  const [rawText, setRawText] = useState("");
  const [cardSeparator, setCardSeparator] = useState("tab"); // tab, comma, dash, colon
  const [lineSeparator, setLineSeparator] = useState("newline"); // newline, semicolon

  const handleImport = () => {
    if (!rawText.trim()) {
      toast.error("Please paste some text to import.");
      return;
    }

    // Determine row delimiter
    const rows = rawText
      .split(lineSeparator === "semicolon" ? ";" : "\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const parsed: ParsedItem[] = [];

    for (const row of rows) {
      let parts: string[] = [];

      if (cardSeparator === "tab") {
        parts = row.split("\t");
      } else if (cardSeparator === "comma") {
        parts = row.split(",");
      } else if (cardSeparator === "dash") {
        parts = row.split(" - ");
        if (parts.length < 2) parts = row.split("-");
      } else if (cardSeparator === "colon") {
        parts = row.split(":");
      }

      if (parts.length >= 2) {
        const question = parts[0].trim();
        const answer = parts.slice(1).join(" ").trim();
        if (question && answer) {
          parsed.push({ question, answer, type: "flashcard" });
        }
      } else if (parts.length === 1 && parts[0].trim()) {
        // Fallback for Q: / A: format
        const match = parts[0].match(/Q:\s*(.+?)\s+A:\s*(.+)/i);
        if (match) {
          parsed.push({
            question: match[1].trim(),
            answer: match[2].trim(),
            type: "flashcard",
          });
        }
      }
    }

    if (parsed.length === 0) {
      toast.error(
        "Could not parse any items. Check your separators (e.g. Term [TAB] Definition per line).",
      );
      return;
    }

    onImport(parsed);
    toast.success(`Imported ${parsed.length} items successfully!`);
    setRawText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Import className="h-5 w-5 text-primary" />
            Import / Paste Bulk Text
          </DialogTitle>
          <DialogDescription>
            Paste your data from Quizlet, Excel, or notes. Format each line with
            a term and definition separated by a Tab or custom character.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Between Term and Definition</Label>
              <Select value={cardSeparator} onValueChange={setCardSeparator}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Separator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tab">Tab (\t) — Quizlet standard</SelectItem>
                  <SelectItem value="comma">Comma (,)</SelectItem>
                  <SelectItem value="dash">Dash (-)</SelectItem>
                  <SelectItem value="colon">Colon (:)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Between Rows</Label>
              <Select value={lineSeparator} onValueChange={setLineSeparator}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Row Break" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newline">New Line</SelectItem>
                  <SelectItem value="semicolon">Semicolon (;)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Paste your text here</Label>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Term 1\tDefinition 1\nTerm 2\tDefinition 2\nTerm 3\tDefinition 3`}
              className="min-h-[220px] font-mono text-xs leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between items-center">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Quizlet paste format fully supported
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleImport}>
              Import Items
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
