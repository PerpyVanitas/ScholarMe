/** Shared UI constants used across dashboard components and pages. */

export const SESSION_STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning-foreground border-warning/30",
  confirmed: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/10 text-success border-success/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
}

export const XP_AWARDS: Record<string, number> = {
  SESSION_COMPLETED: 50,
  QUIZ_SUBMITTED: 20,
  RESOURCE_UPLOADED: 10,
}
