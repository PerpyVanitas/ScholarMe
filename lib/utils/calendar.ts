/**
 * Generates an .ics file content string for a calendar event
 */
export function generateIcsFile({
  title,
  description,
  startTime,
  endTime,
  tutorName,
}: {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  tutorName: string;
}) {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const start = formatDate(startTime);
  const end = formatDate(endTime);
  const now = formatDate(new Date());

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ScholarMe//Tutoring Platform//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `DTSTAMP:${now}`,
    `UID:${now}-${Math.random().toString(36).substring(2)}@scholarme.com`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `ORGANIZER;CN=${tutorName}:mailto:noreply@scholarme.com`,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return icsLines.join("\r\n");
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
