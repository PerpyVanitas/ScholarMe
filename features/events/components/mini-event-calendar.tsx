"use client";

import { useState, useEffect } from "react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  ChevronRight,
  Sparkles,
  QrCode,
} from "lucide-react";
import { FacilityEvent } from "@/lib/types";
import { EventDetailModal } from "./event-detail-modal";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface MiniEventCalendarProps {
  className?: string;
}

export function MiniEventCalendar({ className }: MiniEventCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<FacilityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<FacilityEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      try {
        setLoading(true);
        const supabase = createClient();
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        const { data, error } = await supabase
          .from("facility_events")
          .select(
            `
            *,
            organizer:organizer_id (
              id,
              full_name,
              avatar_url
            ),
            event_rsvps (
              id,
              profile_id,
              status
            )
          `
          )
          .gte("start_time", start.toISOString())
          .lte("end_time", end.toISOString())
          .order("start_time", { ascending: true })
          .abortSignal(controller.signal);

        if (!error && data) {
          setEvents(data as FacilityEvent[]);
        }
      } catch {
        // Suppress abort errors
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
    return () => controller.abort();
  }, []);

  const now = new Date();

  // Find ongoing events right now
  const ongoingEvents = events.filter((e) => {
    const start = parseISO(e.start_time);
    const end = parseISO(e.end_time);
    return now >= start && now <= end;
  });

  // Filter events for the selected day
  const selectedDayEvents = events.filter((e) => {
    if (!date) return false;
    return isSameDay(parseISO(e.start_time), date);
  });

  // Highlight days with events
  const modifiers = {
    hasEvent: events.map((e) => parseISO(e.start_time)),
  };

  const handleEventClick = (event: FacilityEvent) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  return (
    <>
      <Card className={`border-border/60 shadow-sm overflow-hidden ${className || ""}`}>
        <CardHeader className="pb-3 border-b border-border/40 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold tracking-tight text-foreground">
                  Events & Campus Calendar
                </CardTitle>
                <CardDescription className="text-xs">
                  Tap any event for details, attendance & QR check-in
                </CardDescription>
              </div>
            </div>

            <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-primary">
              <Link href="/dashboard/calendar">
                Full Calendar
                <ChevronRight className="h-4 w-4 ml-0.5" />
              </Link>
            </Button>
          </div>

          {/* Ongoing Banner Alert */}
          {ongoingEvents.length > 0 && (
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                {ongoingEvents.length} Event{ongoingEvents.length > 1 ? "s" : ""} Ongoing Now!
              </span>

              <Button
                size="sm"
                className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5"
                onClick={() => handleEventClick(ongoingEvents[0])}
              >
                <QrCode className="h-3.5 w-3.5 mr-1" />
                Scan Attendance
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Mini Calendar Date Picker */}
          <div className="md:col-span-5 flex justify-center border-b md:border-b-0 md:border-r border-border/40 pb-4 md:pb-0 md:pr-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="p-0 pointer-events-auto"
              modifiers={modifiers}
              modifiersClassNames={{
                hasEvent:
                  "font-bold underline decoration-primary decoration-2 underline-offset-4 text-primary",
              }}
            />
          </div>

          {/* Selected Day Events Feed */}
          <div className="md:col-span-7 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  {date ? format(date, "EEEE, MMM d") : "Selected Day"}
                </h4>

                <span className="text-xs text-muted-foreground">
                  {selectedDayEvents.length} Event{selectedDayEvents.length !== 1 ? "s" : ""}
                </span>
              </div>

              {loading ? (
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-muted/60 animate-pulse" />
                  <div className="h-16 rounded-lg bg-muted/60 animate-pulse" />
                </div>
              ) : selectedDayEvents.length > 0 ? (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {selectedDayEvents.map((event) => {
                    const start = parseISO(event.start_time);
                    const end = parseISO(event.end_time);
                    const isOngoingNow = now >= start && now <= end;
                    const rsvpCount = event.event_rsvps?.length || 0;

                    return (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm flex items-center justify-between gap-3 ${
                          isOngoingNow
                            ? "bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/15"
                            : "bg-card border-border/60 hover:bg-muted/50"
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground truncate">
                              {event.title}
                            </span>

                            {event.is_mandatory && (
                              <Badge
                                variant="destructive"
                                className="text-[10px] px-1.5 py-0 h-4"
                              >
                                Mandatory
                              </Badge>
                            )}

                            {isOngoingNow && (
                              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0 h-4 animate-pulse">
                                Live Now
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              {format(start, "h:mm a")} - {format(end, "h:mm a")}
                            </span>

                            {/* Aggregate Participant Count ONLY (no individual names) */}
                            <span className="flex items-center gap-1 font-medium text-foreground/80">
                              <Users className="h-3.5 w-3.5 text-amber-500" />
                              {rsvpCount} Joined
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs bg-muted/20 rounded-lg border border-dashed border-border/60">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-1.5 opacity-40" />
                  No events scheduled for this day.
                </div>
              )}
            </div>

            <div className="pt-2 text-[11px] text-muted-foreground border-t border-border/40 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Attendance yields up to +200 XP
              </span>
              <span>Tap event to check in</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Detail & Attendance Modal */}
      <EventDetailModal
        event={selectedEvent}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onRsvpUpdate={() => {
          // Refresh list
          setDate((prev) => (prev ? new Date(prev) : new Date()));
        }}
      />
    </>
  );
}
