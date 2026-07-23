import { format } from "date-fns";
import type { Poll } from "@/lib/types";

/** True when poll's end_date is still in the future and not closed */
export function isPollActive(poll: { end_date: string; status?: string }): boolean {
  return new Date(poll.end_date) > new Date() && poll.status !== "closed";
}

/** Utility: format timezone-aware date string */
export function formatEndDate(dateStr: string) {
  const d = new Date(dateStr);
  const localStr = format(d, "MMM d, yyyy 'at' h:mm a");
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const absOffset = Math.abs(offset);
  const tzLabel = `UTC${sign}${Math.floor(absOffset / 60)}${absOffset % 60 !== 0 ? `:${absOffset % 60}` : ""}`;
  return `${localStr} (${tzLabel})`;
}
