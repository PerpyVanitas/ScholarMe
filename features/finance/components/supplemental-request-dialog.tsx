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
import { AlertCircle, PlusCircle } from "lucide-react";
import { BudgetRequest } from "@/app/dashboard/finance/types";

interface SupplementalRequestDialogProps {
  approvedRequests: BudgetRequest[];
  onSuccess?: () => void;
}

export function SupplementalRequestDialog({ approvedRequests }: SupplementalRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [varianceAmount, setVarianceAmount] = useState<number | "">("");
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const selectedRequest = approvedRequests.find((r) => r.id === selectedRequestId);
  const originalAmount = selectedRequest ? Number(selectedRequest.amount) : 0;
  const numericVariance = typeof varianceAmount === "number" ? varianceAmount : 0;
  const variancePercentage = originalAmount > 0 ? (numericVariance / originalAmount) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId || !numericVariance || !justification.trim()) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/v1/finance/supplemental", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_request_id: selectedRequestId,
          variance_amount: numericVariance,
          justification,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setOpen(false);
      setSelectedRequestId("");
      setVarianceAmount("");
      setJustification("");
      window.location.reload();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Request Supplemental Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Supplemental Budget Request</DialogTitle>
            <DialogDescription>
              Submit a request for additional funding exceeding an approved activity budget (Policy Section VI).
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
              <Label htmlFor="parent_request">Select Approved Budget Request</Label>
              <select
                id="parent_request"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                required
              >
                <option value="">-- Choose Approved Activity --</option>
                {approvedRequests.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.activity_title} (Original: ₱{req.amount.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variance_amount">Additional Variance Amount (₱ PHP)</Label>
              <Input
                id="variance_amount"
                type="number"
                placeholder="Amount exceeding original budget"
                value={varianceAmount}
                onChange={(e) => setVarianceAmount(e.target.value ? Number(e.target.value) : "")}
                required
              />
            </div>

            {selectedRequest && numericVariance > 0 && (
              <div className={`p-3 rounded-md text-xs border flex items-center justify-between ${variancePercentage > 10 ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>
                <div>
                  <span className="font-semibold">Calculated Variance:</span> {variancePercentage.toFixed(1)}%
                </div>
                {variancePercentage > 10 && (
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    &gt; 10% Policy Limit (Requires President & CoF Review)
                  </span>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="justification">Justification & Scope Change Explanation</Label>
              <Textarea
                id="justification"
                placeholder="Explain why expenses exceeded original budget estimate..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Supplemental Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
