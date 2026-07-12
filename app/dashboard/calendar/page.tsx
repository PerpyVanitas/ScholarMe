import { EventsView } from "@/features/events/components/events-view";

export const metadata = {
  title: "Events Calendar | ScholarMe",
  description: "Announcements, events, and study sessions.",
};

export default async function CalendarPage() {
  return (
    <EventsView
      title="Events Calendar"
      description="Announcements, events, and study sessions."
      emptyTitle="No calendar events yet"
      emptyDescription="Create a calendar event or import one from a syllabus to populate this view."
    />
  );
}
