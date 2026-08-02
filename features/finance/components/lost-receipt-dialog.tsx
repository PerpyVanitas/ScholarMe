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
import { FileQuestion, AlertTriangle } from "lucide-react";
import { submitLiquidation } from "@/features/finance/actions/finance-actions";

interface LostReceiptDialogProps {
  approvedRequests: { id: string; activity_title: string; amount: number }[];
}

export function LostReceiptDialog({ approvedRequests }: LostReceiptDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const formData = new FormData(e.currentTarget);
      await submitLiquidation(formData);
      setOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit lost receipt explanation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-amber-700 dark:text-amber-400 border-amber-500/30">
          <FileQuestion className="h-4 w-4" />
          Submit Missing Receipt Claim
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-amber-500" />
              Lost Receipt Explanation & Affidavit (Policy Sec. VIII)
            </DialogTitle>
            <DialogDescription>
              Submit an official explanation and alternative payment proof when an official receipt is unavailable due to circumstances beyond claimant control.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {errorMsg && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="request_id">Target Budget Request</Label>
              <select
                id="request_id"
                name="request_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">-- Select Approved Budget Request --</option>
                {approvedRequests.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.activity_title} (₱{req.amount?.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Sworn Declaration / Explanation of Circumstances</Label>
              <Textarea
                id="explanation"
                name="explanation"
                placeholder="State why the official receipt could not be obtained from the vendor..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternative_proof">Alternative Payment Proof (GCash SMS / Bank Confirmation / Invoice)</Label>
              <Input
                id="alternative_proof"
                name="proof_of_payment"
                type="file"
                accept="image/*,application/pdf"
                required
              />
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-xs text-amber-800 dark:text-amber-300">
              <strong>Audit Notice:</strong> Intentional submission of false or fabricated lost receipt claims constitutes financial misconduct subject to Red Flag issuance and Committee on Investigation referral.
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Affidavit & Claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
