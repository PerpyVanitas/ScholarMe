import { CalendarDays } from "lucide-react";
import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";
import { AnnouncementCalendar } from "@/components/announcement-calendar";
import { EmptyState } from "@/components/ui/empty-state";
import { getEvents } from "@/features/events/api/actions";

interface EventsViewProps {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}

export async function EventsView({
  title,
  description,
  emptyTitle,
  emptyDescription,
}: EventsViewProps) {
  const now = new Date();
  const monthStart = subMonths(startOfMonth(now), 1);
  const monthEnd = addMonths(endOfMonth(now), 1);

  let initialEvents: any[] = [];
  try {
    initialEvents = await getEvents(monthStart, monthEnd);
  } catch (error) {
    console.error("Error fetching events:", error);
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {initialEvents.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title={emptyTitle}
          description={emptyDescription}
          className="rounded-2xl border border-border/60 bg-muted/20"
        />
      )}

      <AnnouncementCalendar initialEvents={initialEvents} />
    </div>
  );
}
