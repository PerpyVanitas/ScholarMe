"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Zap, AlertCircle } from "lucide-react";
import { createBudgetRequest } from "@/features/finance/actions/finance-actions";

export function EmergencyReimbursementDialog() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const formData = new FormData(e.currentTarget);
      formData.append("is_emergency", "true");
      await createBudgetRequest(formData);
      setOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit reimbursement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10">
          <Zap className="h-4 w-4" />
          Emergency Reimbursement Claim
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Emergency Out-of-Pocket Reimbursement Claim
            </DialogTitle>
            <DialogDescription>
              Claim reimbursement for urgent operational expenses personally advanced when organizational funds could not be released in time (Policy Section VI.C).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {errorMsg && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="activity_title">Activity / Expense Title</Label>
              <Input
                id="activity_title"
                name="activity_title"
                placeholder="e.g., Emergency Office Water Gallons Purchase"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Reimbursement Amount (₱ PHP)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="Exact amount personally advanced"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objectives">Emergency Justification & Written Explanation</Label>
              <Textarea
                id="objectives"
                name="objectives"
                placeholder="Explain why immediate payment was necessary and why regular budget release could not be awaited..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment">Official Receipt / Proof of Out-of-Pocket Payment (PDF/Image)</Label>
              <Input
                id="attachment"
                name="attachment"
                type="file"
                accept="image/*,application/pdf"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Emergency Claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
