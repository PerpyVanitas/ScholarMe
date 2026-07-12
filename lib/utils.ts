import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, differenceInHours } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const hoursDiff = Math.abs(differenceInHours(new Date(), date));

  if (hoursDiff < 24) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getAvatarUrl(
  avatarUrl: string | null | undefined,
): string | undefined {
  if (!avatarUrl) return undefined;
  if (
    avatarUrl.startsWith("http://") ||
    avatarUrl.startsWith("https://") ||
    avatarUrl.startsWith("data:")
  ) {
    return avatarUrl;
  }
  if (avatarUrl.startsWith("avatars/")) {
    return `/api/avatar?pathname=${encodeURIComponent(avatarUrl)}`;
  }
  return avatarUrl;
}

export function generateIcs(
  title: string,
  description: string,
  startDate: Date,
  endDate: Date,
): void {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ScholarMe//EN
BEGIN:VEVENT
UID:${new Date().getTime()}@scholarme.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `${title.replace(/\s+/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
