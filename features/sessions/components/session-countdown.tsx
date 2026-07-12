"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Session } from "@/lib/types";

export function SessionCountdown({ session }: { session: Session }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!session.scheduled_date || !session.start_time) return;

    const sessionDate = new Date(
      `${session.scheduled_date}T${session.start_time}`,
    );

    const updateTimer = () => {
      const now = new Date();
      const diff = sessionDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!timeLeft) return null;

  const isHappeningNow =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  if (isHappeningNow) {
    return (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 animate-pulse w-fit">
        <Clock className="mr-1 h-3.5 w-3.5" />
        Happening Now
      </Badge>
    );
  }

  const format = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium">
      <Badge variant="secondary" className="font-mono px-1.5 py-0.5">
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {format(timeLeft.hours)}:{format(timeLeft.minutes)}:
        {format(timeLeft.seconds)}
      </Badge>
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
        until session
      </span>
    </div>
  );
}
