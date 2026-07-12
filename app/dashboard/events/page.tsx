import { EventsView } from "@/features/events/components/events-view";

export const metadata = {
  title: "Events & Announcements | ScholarMe",
  description: "View upcoming facility events and announcements.",
};

export default async function EventsPage() {
  return (
    <EventsView
      title="Events & Announcements"
      description="View upcoming facility events and announcements."
      emptyTitle="No events scheduled yet"
      emptyDescription="Events will appear here once they are created or imported from a syllabus."
    />
  );
}
