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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface PinConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  amount: number;
  onConfirm: () => Promise<void>;
}

export function PinConfirmationModal({
  open,
  onOpenChange,
  title,
  amount,
  onConfirm,
}: PinConfirmationModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (pin !== "1234" && pin.length < 4) {
      toast.error("Please enter a valid 4-digit approval PIN (Default test PIN: 1234)");
      return;
    }
    setLoading(true);
    try {
      await onConfirm();
      toast.success("Executive approval & cryptographic digital signature confirmed");
      onOpenChange(false);
      setPin("");
    } catch {
      toast.error("Failed to confirm approval");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            2-Step Executive Authorization
          </DialogTitle>
          <DialogDescription className="text-xs">
            Confirming disbursement release of <strong className="text-foreground">{formatCurrency(amount)}</strong> for request <span className="font-semibold text-foreground">"{title}"</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            Releasing major executive funds requires digital signature verification.
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth-pin" className="text-xs font-medium">
              Enter 4-Digit Executive PIN
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="auth-pin"
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="pl-9 text-center font-mono tracking-widest text-lg"
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Test Default PIN: <code className="font-bold">1234</code>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={loading || pin.length < 4}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign & Release Funds"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
