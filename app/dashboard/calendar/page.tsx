"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Info,
  ChevronLeft,
  ChevronRight,
  Plus,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { generateIcs } from "@/lib/utils";
import { SyllabusParserModal } from "./components/syllabus-parser-modal";
import { createEvent } from "@/features/events/api/actions";

// Mock data for initial UI
const INITIAL_EVENTS = [
  {
    id: "1",
    title: "General Assembly 2026",
    date: new Date(new Date().setHours(13, 0, 0, 0)),
    type: "assembly",
    location: "Main Auditorium",
    description:
      "Mandatory general assembly for all honor society members. Please wear business casual attire.",
  },
  {
    id: "2",
    title: "Calculus Study Group",
    date: new Date(new Date().setHours(16, 30, 0, 0)),
    type: "study",
    location: "Library Study Room B",
    description: "Peer tutoring session focusing on integrals and derivatives.",
  },
  {
    id: "3",
    title: "Officer Election Nomination Deadline",
    date: new Date(new Date().setDate(new Date().getDate() + 2)),
    type: "deadline",
    location: "Online",
    description: "Submit all nomination forms via the portal.",
  },
];

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [parserOpen, setParserOpen] = useState(false);

  // Filter events by selected date
  const selectedDateEvents = events.filter(
    (event) => date && event.date.toDateString() === date.toDateString(),
  );

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-primary" />
            Events Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            Announcements, events, and study sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 text-primary"
            onClick={() => setParserOpen(true)}
          >
            <Sparkles className="h-4 w-4" /> AI Parser
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        </div>
      </div>

      {/* Global Announcements */}
      <Card className="border-l-4 border-l-primary shadow-sm bg-primary/5">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="p-3 bg-primary/10 rounded-full shrink-0">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">
              Registration for Fall Semester Open!
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please ensure your profiles are updated and semester dues are paid
              before August 1st. Failure to do so will result in suspension of
              tutoring privileges.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Badge variant="destructive">Urgent</Badge>
            <span className="text-xs text-muted-foreground">
              Posted 2 hours ago
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_400px]">
        {/* Main Content Area: Weekly/Monthly View or Detailed Day View */}
        <div className="space-y-6">
          <Card className="h-full min-h-[500px]">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold">
                  {date?.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
                {selectedDateEvents.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary"
                  >
                    {selectedDateEvents.length} Events
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  Today
                </Button>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {selectedDateEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mb-4 opacity-20" />
                  <p>No events scheduled for this day.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-6 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-lg w-16 h-16 shrink-0">
                            <span className="text-sm font-semibold uppercase">
                              {event.date.toLocaleDateString("en-US", {
                                month: "short",
                              })}
                            </span>
                            <span className="text-2xl font-bold leading-none">
                              {event.date.getDate()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={
                                  event.type === "deadline"
                                    ? "destructive"
                                    : "outline"
                                }
                                className="capitalize text-[10px]"
                              >
                                {event.type}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-bold">{event.title}</h3>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          title="Add to Calendar"
                          onClick={() => {
                            const endDate = new Date(event.date);
                            endDate.setHours(endDate.getHours() + 1); // default 1 hour
                            generateIcs(
                              event.title,
                              event.description,
                              event.date,
                              endDate,
                            );
                          }}
                        >
                          <CalendarDays className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2 mt-4 pl-20">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>
                            {event.date.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span>{event.location}</span>
                        </div>
                        <p className="text-sm mt-3 border-l-2 border-primary/50 pl-3 py-1 mb-4">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                          <span className="text-xs font-semibold text-muted-foreground mr-2">
                            RSVP:
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs hover:bg-success hover:text-success-foreground"
                            onClick={() => toast.success("RSVP'd Going!")}
                          >
                            Going
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs hover:bg-secondary"
                            onClick={() => toast.success("RSVP'd Maybe!")}
                          >
                            Maybe
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => toast.success("RSVP'd Not Going!")}
                          >
                            Not Going
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Mini Calendar and Filters */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 flex justify-center">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" /> Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Assemblies</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Study Sessions</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Deadlines</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Upcoming Assembly
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Don't miss out!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold mb-2">General Assembly 2026</p>
              <Button variant="secondary" className="w-full" size="sm">
                RSVP Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <SyllabusParserModal
        open={parserOpen}
        onOpenChange={setParserOpen}
        onEventsExtracted={async (newEvents) => {
          setEvents((prev) => [...prev, ...newEvents]);
          for (const event of newEvents) {
            const start = new Date(event.date);
            start.setHours(9, 0, 0, 0);
            const end = new Date(start);
            end.setHours(10, 0, 0, 0);
            try {
              await createEvent({
                title: event.title,
                description: event.description,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                color_code:
                  event.type === "deadline" ? "bg-red-500" : "bg-blue-500",
                is_mandatory: event.type === "deadline",
              });
            } catch (error) {
              console.error("Failed to persist syllabus event:", error);
            }
          }
          toast.success(`Saved ${newEvents.length} events to the calendar`);
        }}
      />
    </div>
  );
}
