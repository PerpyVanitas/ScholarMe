/**
 * StepProgress — a numbered step indicator for multi-step forms.
 *
 * Usage:
 *   <StepProgress steps={3} current={2} labels={["Account", "Identity", "Review"]} />
 */
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProgressProps {
  steps: number;
  current: number; // 1-indexed
  labels?: string[];
  className?: string;
}

export function StepProgress({
  steps,
  current,
  labels,
  className,
}: StepProgressProps) {
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol className="flex items-center justify-between">
        {Array.from({ length: steps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < current;
          const isActive = stepNum === current;

          return (
            <li key={stepNum} className="flex flex-1 items-center">
              {/* Circle */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isActive
                        ? "border-primary bg-background text-primary"
                        : "border-muted-foreground/30 bg-background text-muted-foreground",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </div>
                {labels?.[i] && (
                  <span
                    className={cn(
                      "text-[10px] font-medium whitespace-nowrap",
                      isActive
                        ? "text-primary"
                        : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {labels[i]}
                  </span>
                )}
              </div>

              {/* Connector line (not after last step) */}
              {stepNum < steps && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-all",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
