import { AnnouncementCalendar, FacilityEvent } from "@/components/announcement-calendar";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Events & Announcements | ScholarMe",
  description: "View upcoming facility events and announcements.",
};

export default async function EventsPage() {
  const supabase = await createClient();
  
  // Attempt to fetch from DB. Fallback to mock data if empty or table doesn't exist yet
  const { data: events, error } = await supabase
    .from("facility_events")
    .select("*")
    .order("start_time");

  let initialEvents: FacilityEvent[] = events || [];

  if (initialEvents.length === 0) {
    const today = new Date();
    
    const mockDate1 = new Date(today);
    mockDate1.setHours(10, 0, 0, 0);
    
    const mockDate1End = new Date(today);
    mockDate1End.setHours(11, 30, 0, 0);

    const mockDate2 = new Date(today);
    mockDate2.setDate(today.getDate() + 2);
    mockDate2.setHours(14, 0, 0, 0);

    const mockDate2End = new Date(today);
    mockDate2End.setDate(today.getDate() + 2);
    mockDate2End.setHours(16, 0, 0, 0);

    initialEvents = [
      {
        id: "evt-1",
        title: "Weekly Townhall Meeting",
        description: "Join us for our weekly center sync. We will discuss new study policies and upcoming midterms.",
        start_time: mockDate1.toISOString(),
        end_time: mockDate1End.toISOString(),
        color_code: "border-l-blue-500",
        is_mandatory: true
      },
      {
        id: "evt-2",
        title: "Calculus Group Study Session",
        description: "Open floor group study for all Calculus students. Peer tutors will be roaming.",
        start_time: mockDate2.toISOString(),
        end_time: mockDate2End.toISOString(),
        color_code: "border-l-green-500",
        is_mandatory: false
      }
    ];
  }

  return (
    <div className="flex-1 space-y-4">
      <AnnouncementCalendar initialEvents={initialEvents} />
    </div>
  );
}
