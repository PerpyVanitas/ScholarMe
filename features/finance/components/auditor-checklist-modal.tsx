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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface AuditorChecklistModalProps {
  scardId: string;
  onCoSign: () => void;
}

export function AuditorChecklistModal({ scardId, onCoSign }: AuditorChecklistModalProps) {
  const [open, setOpen] = useState(false);
  const [checks, setChecks] = useState({
    mathAccuracy: false,
    receiptCompleteness: false,
    budgetVsActual: false,
    supportingDocs: false,
    policyCompliance: false,
    signaturesComplete: false,
  });
  const [notes, setNotes] = useState("");

  const allChecked = Object.values(checks).every(Boolean);

  const toggleCheck = (key: keyof typeof checks) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApproveAndCosign = () => {
    if (!allChecked) {
      toast.error("All audit checklist items must be satisfied before co-signing SCARDS.");
      return;
    }
    onCoSign();
    setOpen(false);
    toast.success("Audit completed & SCARDS co-signed successfully.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
          <ClipboardCheck className="h-4 w-4" />
          Auditor Checklist & Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            Standardized Auditor&apos;s Checklist (Policy Sec. XI)
          </DialogTitle>
          <DialogDescription>
            The Auditor must verify all requirements before co-signing the Statement of Cash Receipts and Disbursements (SCARDS).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50">
            <Checkbox
              id="math"
              checked={checks.mathAccuracy}
              onCheckedChange={() => toggleCheck("mathAccuracy")}
            />
            <Label htmlFor="math" className="cursor-pointer font-medium">1. Mathematical accuracy verified</Label>
          </div>

          <div className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50">
            <Checkbox
              id="receipts"
              checked={checks.receiptCompleteness}
              onCheckedChange={() => toggleCheck("receiptCompleteness")}
            />
            <Label htmlFor="receipts" className="cursor-pointer font-medium">2. Official receipts complete & valid</Label>
          </div>

          <div className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50">
            <Checkbox
              id="variance"
              checked={checks.budgetVsActual}
              onCheckedChange={() => toggleCheck("budgetVsActual")}
            />
            <Label htmlFor="variance" className="cursor-pointer font-medium">3. Budget vs. actual expense variance checked</Label>
          </div>

          <div className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50">
            <Checkbox
              id="docs"
              checked={checks.supportingDocs}
              onCheckedChange={() => toggleCheck("supportingDocs")}
            />
            <Label htmlFor="docs" className="cursor-pointer font-medium">4. Supporting document references verified</Label>
          </div>

          <div className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50">
            <Checkbox
              id="policy"
              checked={checks.policyCompliance}
              onCheckedChange={() => toggleCheck("policyCompliance")}
            />
            <Label htmlFor="policy" className="cursor-pointer font-medium">5. Organizational policy compliance confirmed</Label>
          </div>

          <div className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50">
            <Checkbox
              id="signatures"
              checked={checks.signaturesComplete}
              onCheckedChange={() => toggleCheck("signaturesComplete")}
            />
            <Label htmlFor="signatures" className="cursor-pointer font-medium">6. Proper approvals & signatures present</Label>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label htmlFor="notes">Auditor Remarks / Audit Findings Notes</Label>
            <Textarea
              id="notes"
              placeholder="Record any minor corrections or audit observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApproveAndCosign}
            disabled={!allChecked}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            Co-sign SCARDS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
