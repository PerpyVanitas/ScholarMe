"use client";

import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Crown,
  Shield,
  GraduationCap,
  Award,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HsDesignation } from "@/lib/types";
import { Dispatch, SetStateAction } from "react";

interface DesignationCardProps {
  designations: HsDesignation[];
  setDesignations: Dispatch<SetStateAction<HsDesignation[]>>;
  setEditingDesignation: (d: HsDesignation | null) => void;
  setDesigType: (t: unknown) => void;
  setDesigPosition: (p: string) => void;
  setDesigAcademicYear: (y: string) => void;
  setDesigIsCurrent: (c: boolean) => void;
  setDesignationDialogOpen: (o: boolean) => void;
}

export function DesignationCard({
  designations,
  setDesignations,
  setEditingDesignation,
  setDesigType,
  setDesigPosition,
  setDesigAcademicYear,
  setDesigIsCurrent,
  setDesignationDialogOpen,
}: DesignationCardProps) {
  const supabase = createClient();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Honor Society Designation
          </CardTitle>
          <CardDescription>
            Your current and past designations in the Honor Society
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setEditingDesignation(null);
            setDesigType("member");
            setDesigPosition("");
            setDesigAcademicYear("2024-2025");
            setDesigIsCurrent(designations.length === 0);
            setDesignationDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent>
        {designations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No designations added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {[...designations]
              .sort((a, b) => {
                if (a.is_current && !b.is_current) return -1;
                if (!a.is_current && b.is_current) return 1;
                return b.academic_year.localeCompare(a.academic_year);
              })
              .map((d) => (
                <div
                  key={d.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    d.is_current
                      ? "border-primary/30 bg-primary/5"
                      : "border-muted bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        d.designation === "esas_scholar"
                          ? "bg-amber-500/10 text-amber-500"
                          : d.designation === "officer"
                            ? "bg-blue-500/10 text-blue-500"
                            : d.designation === "administrator"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {d.designation === "officer" ? (
                        <Shield className="h-4 w-4" />
                      ) : d.designation === "esas_scholar" ? (
                        <GraduationCap className="h-4 w-4" />
                      ) : d.designation === "administrator" ? (
                        <Crown className="h-4 w-4" />
                      ) : (
                        <Award className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm capitalize">
                          {d.designation === "esas_scholar"
                            ? "ESAS Scholar"
                            : d.designation === "officer"
                              ? d.position || "Officer"
                              : d.designation.charAt(0).toUpperCase() +
                                d.designation.slice(1)}
                        </span>
                        {d.is_current && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Current
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        AY {d.academic_year}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        setEditingDesignation(d);
                        setDesigType(d.designation);
                        setDesigPosition(d.position || "");
                        setDesigAcademicYear(d.academic_year);
                        setDesigIsCurrent(d.is_current);
                        setDesignationDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      onClick={async () => {
                        const { error } = await supabase
                          .from("hs_designations")
                          .delete()
                          .eq("id", d.id);
                        if (error) {
                          toast.error("Failed to delete");
                        } else {
                          setDesignations((prev) =>
                            prev.filter((x) => x.id !== d.id),
                          );
                          toast.success("Removed");
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
