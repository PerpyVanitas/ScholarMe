import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic"; // Always fetch fresh data

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tutorId: string }> },
) {
  const { tutorId } = await context.params;

  if (!tutorId) {
    return new NextResponse("Tutor ID is required", { status: 400 });
  }

  const supabase = await createClient();

  // Verify tutor exists and has calendar_sync_enabled
  const { data: tutor } = await supabase
    .from("tutors")
    .select("calendar_sync_enabled, profiles(first_name, last_name)")
    .eq("id", tutorId)
    .single();

  if (!tutor || !tutor.calendar_sync_enabled) {
    return new NextResponse("Calendar sync is not enabled for this tutor", {
      status: 403,
    });
  }

  // Fetch upcoming confirmed sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("*, specializations(name)")
    .eq("tutor_id", tutorId)
    .eq("status", "confirmed")
    .gte("scheduled_date", new Date().toISOString().split("T")[0])
    .order("scheduled_date", { ascending: true });

  if (sessionsError) {
    return new NextResponse("Failed to fetch sessions", { status: 500 });
  }

  // Supabase returns [] not null for empty results — handle both gracefully
  if (!sessions || sessions.length === 0) {
    return new NextResponse("No upcoming sessions found", { status: 404 });
  }

  // Generate ICS File
  let icsContent = "BEGIN:VCALENDAR\r\n";
  icsContent += "VERSION:2.0\r\n";
  icsContent += "PRODID:-//ScholarMe//Tutor Schedule//EN\r\n";
  icsContent += "CALSCALE:GREGORIAN\r\n";
  icsContent += "METHOD:PUBLISH\r\n";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tutorProfile = Array.isArray((tutor as any).profiles)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (tutor as any).profiles[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (tutor as any).profiles;
  const tutorName = tutorProfile?.first_name
    ? `${tutorProfile.first_name} ${tutorProfile.last_name || ""}`.trim()
    : "Tutor";
  icsContent += `X-WR-CALNAME:ScholarMe - ${tutorName}\r\n`;

  const formatICSDate = (dateStr: string, timeStr: string) => {
    const dt = new Date(`${dateStr}T${timeStr}`);
    return dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const getStamp = () => {
    return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessions.forEach((session: any) => {
    icsContent += "BEGIN:VEVENT\r\n";
    icsContent += `UID:session-${session.id}@scholarme.app\r\n`;
    icsContent += `DTSTAMP:${getStamp()}\r\n`;
    icsContent += `DTSTART:${formatICSDate(session.scheduled_date, session.start_time)}\r\n`;
    icsContent += `DTEND:${formatICSDate(session.scheduled_date, session.end_time)}\r\n`;

    let summary = "Tutoring Session";
    if (session.specializations?.name) {
      summary += ` - ${session.specializations.name}`;
    }

    icsContent += `SUMMARY:${summary}\r\n`;

    let description = "ScholarMe Tutoring Session";
    if (session.meeting_link) {
      description += `\\nMeeting Link: ${session.meeting_link}`;
    }
    if (session.notes) {
      description += `\\nNotes: ${session.notes}`;
    }

    icsContent += `DESCRIPTION:${description}\r\n`;

    if (session.meeting_link) {
      icsContent += `LOCATION:${session.meeting_link}\r\n`;
    }

    icsContent += "STATUS:CONFIRMED\r\n";
    icsContent += "END:VEVENT\r\n";
  });

  icsContent += "END:VCALENDAR\r\n";

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="scholarme-tutor-${tutorId}.ics"`,
    },
  });
}
