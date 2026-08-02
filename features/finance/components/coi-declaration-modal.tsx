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
import { AlertTriangle, ShieldCheck } from "lucide-react";

interface CoiDeclarationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hasConflict: boolean, reason?: string) => void;
  transactionTitle: string;
}

export function CoiDeclarationModal({
  isOpen,
  onClose,
  onConfirm,
  transactionTitle,
}: CoiDeclarationModalProps) {
  const [hasConflict, setHasConflict] = useState<boolean | null>(null);
  const [reason, setReason] = useState("");

  const handleProceed = () => {
    if (hasConflict === null) return;
    onConfirm(hasConflict, hasConflict ? reason : undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
            Conflict of Interest Declaration
          </DialogTitle>
          <DialogDescription>
            Section IV of the Financial System Policy requires all approving officers to declare any conflict of interest regarding: <strong>{transactionTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Do you have a personal, financial, or familial conflict of interest with this transaction?</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={hasConflict === false ? "default" : "outline"}
                className={hasConflict === false ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => setHasConflict(false)}
              >
                No Conflict
              </Button>
              <Button
                type="button"
                variant={hasConflict === true ? "destructive" : "outline"}
                onClick={() => setHasConflict(true)}
              >
                Conflict Exists
              </Button>
            </div>
          </div>

          {hasConflict === true && (
            <div className="space-y-2">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Declaring a conflict will automatically abstain you from this transaction and reassign approval authority to the next non-conflicted officer or Faculty Adviser.
                </span>
              </div>
              <Label htmlFor="coi-reason">Reason for Conflict / Disclosure Statement</Label>
              <Textarea
                id="coi-reason"
                placeholder="State the nature of the conflict (e.g., immediate family member, personal business relationship)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleProceed}
            disabled={hasConflict === null || (hasConflict === true && !reason.trim())}
          >
            Confirm Declaration & Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
