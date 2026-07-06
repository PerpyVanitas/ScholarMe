"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { QrIdCard } from "@/features/auth/components/qr-id-card";
import { HonorSocietyLogo } from "@/components/honsoc-logo";
import type { Profile } from "@/lib/types";

interface UserIdCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
  onUpdateUser: (profile: Profile) => void;
}

export function UserIdCardDialog({
  open,
  onOpenChange,
  user,
  onUpdateUser,
}: UserIdCardDialogProps) {
  const [updatingCard, setUpdatingCard] = useState(false);

  async function handleToggleStatus() {
    if (!user) return;
    const newStatus = !user.is_card_issued;
    setUpdatingCard(true);
    try {
      const res = await fetch("/api/admin/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          is_card_issued: newStatus,
        }),
      });
      if (res.ok) {
        onUpdateUser({ ...user, is_card_issued: newStatus });
        toast.success(
          `Card marked as ${newStatus ? "Issued" : "Not Issued"} successfully!`,
        );
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update card status");
      }
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingCard(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-zinc-950 border-zinc-800 text-white p-6 outline-none relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <HonorSocietyLogo variant="white" className="w-[500px] h-[500px]" />
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-6 relative z-10">
          <div className="flex-1 flex flex-col items-center justify-center">
            {user && (
              <QrIdCard
                profile={user}
                role={
                  Array.isArray(user.roles) && user.roles.length > 0
                    ? user.roles[0].name
                    : "learner"
                }
                showCompactPreview={false}
              />
            )}
          </div>

          <div className="hidden md:block w-px bg-zinc-800 self-stretch my-2"></div>

          <div className="flex-1 flex flex-col justify-start space-y-4 text-left">
            <div>
              <DialogTitle className="text-xl font-bold tracking-widest text-[#FFD700] uppercase">
                CARD MANAGEMENT
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs font-medium mt-1">
                Manage the physical card status for{" "}
                {user?.full_name || "this user"}.
              </DialogDescription>
            </div>

            <Separator className="bg-zinc-800" />

            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">
                    Card Status:
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      user?.is_card_issued
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold uppercase text-[10px]"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold uppercase text-[10px]"
                    }
                  >
                    {user?.is_card_issued ? "Issued" : "Not Issued"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">
                    Unique ID:
                  </span>
                  <span className="font-mono text-xs text-zinc-200 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                    {user?.unique_id_number || "PENDING"}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <Button
                  onClick={handleToggleStatus}
                  disabled={updatingCard || !user?.unique_id_number}
                  variant={user?.is_card_issued ? "outline" : "default"}
                  className={
                    user?.is_card_issued
                      ? "w-full border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      : "w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold text-sm"
                  }
                >
                  {updatingCard ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : user?.is_card_issued ? (
                    "Mark as Not Issued"
                  ) : (
                    "Mark as Issued"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
