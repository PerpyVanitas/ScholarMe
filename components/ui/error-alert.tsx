/** Error Alert component - displays SDD-compliant error messages with code prefix */
"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorAlertProps {
  error: string;
  className?: string;
}

/**
 * Displays an error message with proper styling and accessibility.
 * Error messages should follow the format: [CODE] Message: Details
 */
export function ErrorAlert({ error, className }: ErrorAlertProps) {
  if (!error) return null;

  // Parse the error code from the message if present
  const codeMatch = error.match(/^\[([A-Z]+-\d+)\]/);
  const hasCode = codeMatch !== null;
  const code = codeMatch?.[1] || "";
  const messageWithoutCode = hasCode ? error.replace(/^\[[A-Z]+-\d+\]\s*/, "") : error;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <div className="flex flex-col gap-0.5">
        {hasCode && (
          <span className="font-mono text-xs text-destructive/80">{code}</span>
        )}
        <span className="text-destructive">{messageWithoutCode}</span>
      </div>
    </div>
  );
}
