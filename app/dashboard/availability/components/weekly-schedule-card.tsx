"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2 } from "lucide-react";
import { DAYS_OF_WEEK, type TutorAvailability } from "@/lib/types";

interface WeeklyScheduleCardProps {
  slots: TutorAvailability[];
  onOpenCopy: () => void;
  onRemoveSlot: (id: string) => void;
}

export function WeeklyScheduleCard({ slots, onOpenCopy, onRemoveSlot }: WeeklyScheduleCardProps) {
  const groupedSlots = DAYS_OF_WEEK.map((day, idx) => ({
    day,
    idx,
    slots: slots.filter((s) => s.day_of_week === idx),
  }));

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Your Weekly Schedule</CardTitle>
          <CardDescription>Your current availability slots</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Day
        </Button>
      </CardHeader>
      <CardContent>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No availability slots set. Add some above.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {groupedSlots
              .filter((g) => g.slots.length > 0)
              .map(({ day, slots: daySlots }) => (
                <div
                  key={day}
                  className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-start sm:gap-4"
                >
                  <span className="text-sm font-medium text-foreground sm:w-24 sm:pt-1">
                    {day}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((slot) => (
                      <Badge
                        key={slot.id}
                        variant="secondary"
                        className="flex items-center gap-1.5 text-xs pr-1"
                      >
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        <button
                          onClick={() => onRemoveSlot(slot.id)}
                          className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                          aria-label="Remove slot"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
