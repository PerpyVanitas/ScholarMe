"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, UserCheck, Eye, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface SuperAdminBannerProps {
  currentRole: string;
  onSimulateRole?: (role: string) => void;
}

export function SuperAdminBanner({ currentRole, onSimulateRole }: SuperAdminBannerProps) {
  const [simulatedRole, setSimulatedRole] = useState<string>("none");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || currentRole !== "super_admin") return null;

  function handleRoleChange(val: string) {
    setSimulatedRole(val);
    if (onSimulateRole) {
      onSimulateRole(val === "none" ? "super_admin" : val);
    }
    toast.info(
      val === "none"
        ? "Restored Super Admin full access view"
        : `Simulating view as role: ${val.toUpperCase()}`
    );
  }

  return (
    <div className="bg-amber-950 text-amber-100 border-b border-amber-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md">
      <div className="flex items-center gap-2 font-medium">
        <ShieldAlert className="h-4 w-4 text-amber-400 animate-pulse" />
        <span>SUPER ADMIN DIAGNOSTIC MODE</span>
        <Badge variant="outline" className="bg-amber-900/60 text-amber-300 border-amber-700 text-[10px]">
          System Override Active
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-amber-300" />
          <span className="text-amber-200">Simulate View:</span>
          <Select value={simulatedRole} onValueChange={handleRoleChange}>
            <SelectTrigger className="h-7 w-32 bg-amber-900/80 text-amber-100 border-amber-700 text-xs">
              <SelectValue placeholder="Full Admin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Super Admin</SelectItem>
              <SelectItem value="learner">Learner</SelectItem>
              <SelectItem value="tutor">Tutor</SelectItem>
              <SelectItem value="committee_head">Committee Head</SelectItem>
              <SelectItem value="treasurer">Treasurer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {simulatedRole !== "none" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleRoleChange("none")}
            className="h-7 text-xs text-amber-300 hover:text-amber-100 hover:bg-amber-900/50"
          >
            <UserCheck className="h-3.5 w-3.5 mr-1" /> Reset View
          </Button>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-100 p-1"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
