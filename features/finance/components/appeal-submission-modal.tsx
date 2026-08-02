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
import { Scale, AlertCircle } from "lucide-react";

interface AppealSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  flagId: string;
  flagLevel: string;
  reason: string;
}

export function AppealSubmissionModal({
  isOpen,
  onClose,
  flagId,
  flagLevel,
  reason,
}: AppealSubmissionModalProps) {
  const [appealLetter, setAppealLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealLetter.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/finance/investigations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flag_id: flagId,
          meeting_notes: `Written Appeal for ${flagLevel.toUpperCase()} flag: ${appealLetter}`,
          status: "ongoing",
        }),
      });

      if (res.ok) {
        setAppealLetter("");
        onClose();
        window.location.reload();
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-indigo-600" />
              File Written Appeal (Policy Section XIV)
            </DialogTitle>
            <DialogDescription>
              Officers issued an Orange or Red flag may file a written appeal within <strong>three (3) calendar days</strong> of receipt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-md text-xs space-y-1 border">
              <span className="font-semibold text-foreground block">Target Violation:</span>
              <p className="text-muted-foreground">{reason}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appeal_letter">Written Appeal Statement & Defense Evidence</Label>
              <Textarea
                id="appeal_letter"
                placeholder="State grounds for appeal, mitigating factors, and evidence..."
                value={appealLetter}
                onChange={(e) => setAppealLetter(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !appealLetter.trim()}>
              {submitting ? "Filing..." : "Submit Appeal to Committee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
