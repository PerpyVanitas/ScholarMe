"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";

export type WorkflowStage =
  | "submission"
  | "cof_review"
  | "president_approval"
  | "fund_release"
  | "implementation"
  | "liquidation"
  | "scards_prep"
  | "auditor_review"
  | "cosigned"
  | "archived";

interface WorkflowProgressTrackerProps {
  currentStage: WorkflowStage;
}

const STAGES: { key: WorkflowStage; label: string }[] = [
  { key: "submission", label: "Request Submitted" },
  { key: "cof_review", label: "CoF Review" },
  { key: "president_approval", label: "President Approval" },
  { key: "fund_release", label: "Fund Release" },
  { key: "implementation", label: "Activity Implementation" },
  { key: "liquidation", label: "Liquidation Submission" },
  { key: "scards_prep", label: "SCARDS Preparation" },
  { key: "auditor_review", label: "Auditor Review" },
  { key: "cosigned", label: "Co-signed SCARDS" },
  { key: "archived", label: "Archived & Completed" },
];

export function WorkflowProgressTracker({ currentStage }: WorkflowProgressTrackerProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="w-full py-4 space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Financial Transaction Lifecycle (Policy Section V)
      </h4>
      <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={stage.key} className="flex flex-col items-center min-w-[90px] text-center space-y-1">
              <div className="flex items-center w-full">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-amber-500 text-white animate-pulse"
                      : "bg-muted text-muted-foreground border"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
              </div>
              <span
                className={`text-[10px] leading-tight font-medium ${
                  isCurrent ? "text-amber-600 dark:text-amber-400 font-bold" : isDone ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
