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
import { Loader2, Sparkles } from "lucide-react";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { toast } from "sonner";

interface SyllabusEvent {
  id: string;
  title: string;
  date: Date;
  type: string;
  location: string;
  description: string;
}

interface SyllabusParserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventsExtracted: (events: SyllabusEvent[]) => void;
}

export function SyllabusParserModal({
  open,
  onOpenChange,
  onEventsExtracted,
}: SyllabusParserModalProps) {
  const [syllabusText, setSyllabusText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [progressText, setProgressText] = useState("");

  const handleParse = async () => {
    if (!syllabusText.trim()) {
      toast.error("Please paste the syllabus text.");
      return;
    }

    try {
      setParsing(true);
      setProgressText("Loading AI Engine...");

      const engine = await CreateMLCEngine(
        "Llama-3.2-1B-Instruct-q4f32_1-MLC",
        {
          initProgressCallback: (progress) => {
            setProgressText(
              `Loading AI: ${Math.round(progress.progress * 100)}%`,
            );
          },
        },
      );

      setProgressText("Extracting dates from syllabus...");

      const systemPrompt = `You are a scheduling assistant. Extract key dates and events from the syllabus text below. 
Output ONLY a valid JSON array of objects. Each object must have these exact keys: "title" (string), "date" (string in YYYY-MM-DD format), "type" (string, usually "deadline" or "study"), "location" (string), "description" (string).
No markdown blocks, no other text. Just the JSON array.`;

      const reply = (await (engine as any).chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Syllabus Text:\n${syllabusText}` },
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
          throw new Error("Failed to parse JSON response from AI.");
        }
      }

      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error("No events found in the syllabus text.");
      }

      const events: SyllabusEvent[] = parsedData.map((item, index) => ({
        id: `ai-event-${Date.now()}-${index}`,
        title: item.title || "Untitled Event",
        date: new Date(item.date || new Date().toISOString()),
        type: item.type || "deadline",
        location: item.location || "TBA",
        description: item.description || "Parsed from syllabus",
      }));

      onEventsExtracted(events);
      toast.success(`Successfully extracted ${events.length} events!`);
      setSyllabusText("");
      onOpenChange(false);
    } catch (error) {
      console.error("Syllabus parsing error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to extract dates.",
      );
    } finally {
      setParsing(false);
      setProgressText("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Syllabus Parser
          </DialogTitle>
          <DialogDescription>
            Paste the text from your course syllabus. Our local AI will
            automatically extract key dates, assignments, and exams and add them
            to your calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Paste syllabus text here (e.g. 'Midterm Exam on October 15th...')"
            className="min-h-[200px]"
            value={syllabusText}
            onChange={(e) => setSyllabusText(e.target.value)}
            disabled={parsing}
          />
          {parsing && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{progressText}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={parsing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleParse}
            disabled={parsing || !syllabusText.trim()}
          >
            {parsing ? "Parsing..." : "Extract Events"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
