/**
 * Timezone Utility Functions
 * 
 * Provides local browser timezone detection and slot formatting for global session scheduling.
 */

/**
 * Gets the current user's local IANA timezone name (e.g. "Asia/Manila").
 */
export function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila";
  } catch {
    return "Asia/Manila";
  }
}

/**
 * Formats a UTC ISO date string into the user's local timezone representation.
 */
export function formatInLocalTimezone(
  dateInput: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: getLocalTimezone(),
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  return new Intl.DateTimeFormat("en-US", { ...defaultOptions, ...options }).format(date);
}

/**
 * Formats a 24-hour time string (e.g. "14:00") into formatted 12-hour local time (e.g. "2:00 PM").
 */
export function formatTimeString(timeStr: string): string {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
