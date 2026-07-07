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
import { Loader2, Sparkles, FileText, Download } from "lucide-react";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { toast } from "sonner";
import type { Session } from "@/lib/types";
import ReactMarkdown from "react-markdown";

interface SessionSummaryModalProps {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionSummaryModal({
  session,
  open,
  onOpenChange,
}: SessionSummaryModalProps) {
  const [generating, setGenerating] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [summary, setSummary] = useState("");

  const handleGenerate = async () => {
    if (!session) return;
    try {
      setGenerating(true);
      setSummary("");
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

      setProgressText("Analyzing session data...");

      const tutorName = session.tutors?.profiles?.full_name || "Tutor";
      const subject = session.specializations?.name || "General Study";
      const durationHours =
        (new Date(`2000-01-01T${session.end_time}`).getTime() -
          new Date(`2000-01-01T${session.start_time}`).getTime()) /
        (1000 * 60 * 60);

      const systemPrompt = `You are an educational assistant. Generate a concise 3-bullet point summary of what likely occurred during a tutoring session based on the provided context. Make it sound encouraging and professional. Do not add intro or outro text, just the bullet points.`;

      const userPrompt = `Context:\n- Subject: ${subject}\n- Tutor: ${tutorName}\n- Duration: ${durationHours} hours\n- Notes: ${session.notes || "None provided"}`;

      setProgressText("Generating summary...");

      const reply = await engine.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      setSummary(
        reply.choices[0]?.message.content || "Failed to generate summary.",
      );
      toast.success("Summary generated!");
    } catch (error) {
      console.error("Summary generation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate summary.",
      );
    } finally {
      setGenerating(false);
      setProgressText("");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Session_Summary_${session?.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) setSummary("");
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Session Summary
          </DialogTitle>
          <DialogDescription>
            Generate a smart summary of your session based on the subject,
            tutor, and duration.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 min-h-[150px] flex flex-col items-center justify-center border rounded-md bg-muted/20">
          {!summary && !generating && (
            <div className="text-center p-6 text-muted-foreground flex flex-col items-center gap-2">
              <FileText className="h-10 w-10 opacity-20" />
              <p>No summary generated yet.</p>
            </div>
          )}
          {generating && (
            <div className="flex flex-col items-center justify-center gap-3 text-primary p-6">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm font-medium">{progressText}</span>
            </div>
          )}
          {summary && !generating && (
            <div className="p-4 w-full prose prose-sm dark:prose-invert text-left">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between w-full">
          {summary && !generating ? (
            <Button
              variant="outline"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" /> Download
            </Button>
          ) : (
            <div></div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={generating}
            >
              Close
            </Button>
            {!summary && (
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? "Generating..." : "Generate AI Summary"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
