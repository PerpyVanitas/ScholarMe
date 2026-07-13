"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhysicalResource } from "@/lib/types";
import { checkoutResource } from "../api/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: PhysicalResource | null;
}

export function CheckoutModal({
  open,
  onOpenChange,
  resource,
}: CheckoutModalProps) {
  const [learnerId, setLearnerId] = useState("");
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);

  if (!resource) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerId) {
      toast.error("Please enter a Learner ID (Profile ID)");
      return;
    }
    setLoading(true);
    try {
      await checkoutResource(resource.id, learnerId, days);
      toast.success(`${resource.title} checked out successfully`);
      onOpenChange(false);
      setLearnerId("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e.message || "Failed to checkout resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Checkout Resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCheckout} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Resource</Label>
            <p className="text-sm font-medium">{resource.title}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="learnerId">Learner Profile ID</Label>
            <Input
              id="learnerId"
              placeholder="e.g. uuid-of-learner"
              value={learnerId}
              onChange={(e) => setLearnerId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              In a real app, this would be a searchable dropdown of users or
              scan their ID card.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="days">Days to Keep</Label>
            <Input
              id="days"
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Checkout
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
