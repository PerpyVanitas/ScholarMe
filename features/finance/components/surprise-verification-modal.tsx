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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldAlert, CheckCircle2, AlertTriangle, Calculator } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface SurpriseVerificationModalProps {
  systemPettyCashBalance?: number;
  systemCollectionBalance?: number;
  onSuccess?: () => void;
}

export function SurpriseVerificationModal({
  systemPettyCashBalance = 1500,
  systemCollectionBalance = 0,
  onSuccess,
}: SurpriseVerificationModalProps) {
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState<"petty_cash" | "collections">("petty_cash");
  const [actualPhysicalCount, setActualPhysicalCount] = useState<number | "">("");
  const [discrepancyNotes, setDiscrepancyNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const expectedAmount = targetType === "petty_cash" ? systemPettyCashBalance : systemCollectionBalance;
  const numericCount = typeof actualPhysicalCount === "number" ? actualPhysicalCount : 0;
  const variance = numericCount - expectedAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualPhysicalCount === "") {
      toast.error("Please enter the physical cash count.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/v1/finance/surprise-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: targetType,
          expected_amount: expectedAmount,
          actual_count: numericCount,
          variance,
          notes: discrepancyNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record audit verification");
      }

      toast.success("Surprise cash verification audit record created successfully.");
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record verification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-500/10">
          <ShieldAlert className="h-3.5 w-3.5" />
          Surprise Cash Audit (11.1)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Calculator className="h-5 w-5 text-amber-500" />
              Surprise Cash Verification Audit
            </DialogTitle>
            <DialogDescription className="text-xs">
              Perform an unannounced physical cash count verification per Policy Spec 11.1.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Audit Target Fund</Label>
              <Select
                value={targetType}
                onValueChange={(val) => setTargetType(val as "petty_cash" | "collections")}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petty_cash">Petty Cash Revolving Fund</SelectItem>
                  <SelectItem value="collections">Revenue & Collection Cash Box</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg text-xs flex justify-between items-center border">
              <span className="text-muted-foreground">Expected Ledger Balance:</span>
              <strong className="font-mono text-sm">{formatCurrency(expectedAmount)}</strong>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Actual Physical Cash Counted (₱ PHP)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter physical total count..."
                value={actualPhysicalCount}
                onChange={(e) => setActualPhysicalCount(e.target.value ? Number(e.target.value) : "")}
                className="h-9 text-xs font-mono"
                required
              />
            </div>

            {actualPhysicalCount !== "" && (
              <div
                className={`p-3 rounded-lg text-xs border flex items-center justify-between ${
                  variance === 0
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
              >
                <div className="flex items-center gap-2">
                  {variance === 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <span>Variance: <strong>{formatCurrency(variance)}</strong></span>
                </div>
                <span className="font-semibold">{variance === 0 ? "Balanced" : variance < 0 ? "Shortage" : "Surplus"}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Auditor Observations & Notes</Label>
              <Textarea
                placeholder="Note any denominations, missing receipts, or explanations..."
                value={discrepancyNotes}
                onChange={(e) => setDiscrepancyNotes(e.target.value)}
                className="min-h-[70px] text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Logging Audit..." : "Record Verification Audit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
