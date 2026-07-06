"use client";

import { useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Info } from "lucide-react";

export type FacilityEvent = {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  color_code: string;
  is_mandatory: boolean;
};

interface AnnouncementCalendarProps {
  initialEvents: FacilityEvent[];
}

export function AnnouncementCalendar({ initialEvents }: AnnouncementCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Filter events for the selected day
  const selectedDayEvents = initialEvents.filter(event => {
    if (!date) return false;
    return isSameDay(parseISO(event.start_time), date);
  });

  // Highlight days with events
  const modifiers = {
    hasEvent: initialEvents.map(e => parseISO(e.start_time)),
  };

  const modifiersStyles = {
    hasEvent: { fontWeight: 'bold', border: '2px solid currentColor' }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      <Card className="md:col-span-4 lg:col-span-3 flex flex-col items-center pt-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
        />
      </Card>
      
      <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Announcements & Events</h2>
          <p className="text-muted-foreground">
            {date ? `Events for ${format(date, "MMMM do, yyyy")}` : "Select a date to view events"}
          </p>
        </div>

        {selectedDayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No events scheduled</h3>
            <p className="text-muted-foreground text-sm mt-1">There are no announcements for this day.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {selectedDayEvents.map(event => (
              <Card key={event.id} className={`overflow-hidden border-l-4 ${event.color_code}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    {event.is_mandatory && (
                      <Badge variant="destructive">Mandatory</Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {format(parseISO(event.start_time), "h:mm a")} - {format(parseISO(event.end_time), "h:mm a")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {event.description || "No description provided."}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
