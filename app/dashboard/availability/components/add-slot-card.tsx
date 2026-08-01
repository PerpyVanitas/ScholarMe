"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus } from "lucide-react";
import { DAYS_OF_WEEK } from "@/lib/types";

interface AddSlotCardProps {
  newDay: string;
  setNewDay: (val: string) => void;
  newStart: string;
  setNewStart: (val: string) => void;
  newEnd: string;
  setNewEnd: (val: string) => void;
  onAddSlot: () => void;
}

export function AddSlotCard({
  newDay,
  setNewDay,
  newStart,
  setNewStart,
  newEnd,
  setNewEnd,
  onAddSlot,
}: AddSlotCardProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Add Availability Slot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2 flex-1">
            <Label>Day</Label>
            <Select value={newDay} onValueChange={setNewDay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Start</Label>
            <Input
              type="time"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>End</Label>
            <Input
              type="time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
            />
          </div>
          <Button onClick={onAddSlot}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
