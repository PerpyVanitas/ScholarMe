/**
 * Utility for generating 1-click Google Calendar and Outlook Web calendar add links,
 * plus downloadable .ics calendar files for booked sessions.
 */

export interface CalendarEventDetails {
  title: string;
  description: string;
  location: string;
  startTime: string; // ISO 8601 string
  durationMinutes?: number;
}

export function generateGoogleCalendarUrl(event: CalendarEventDetails): string {
  const start = new Date(event.startTime);
  const duration = event.durationMinutes || 60;
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    location: event.location,
    dates: `${formatDate(start)}/${formatDate(end)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateOutlookCalendarUrl(event: CalendarEventDetails): string {
  const start = new Date(event.startTime);
  const duration = event.durationMinutes || 60;
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    body: event.description,
    location: event.location,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
