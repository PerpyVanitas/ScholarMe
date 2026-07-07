"use client";

import { Plus, BookOpen, Clock, Calendar } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function MobileFab() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-6 z-50 md:hidden">
      {isOpen && (
        <div className="flex flex-col gap-3 mb-4 items-end animate-in slide-in-from-bottom-5">
          <Link
            href="/dashboard/tutors"
            className="flex items-center gap-2 bg-background border shadow-md rounded-full px-4 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => setIsOpen(false)}
          >
            New Session
            <Calendar className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/study/flashcards"
            className="flex items-center gap-2 bg-background border shadow-md rounded-full px-4 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => setIsOpen(false)}
          >
            Study Deck
            <BookOpen className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/timesheet"
            className="flex items-center gap-2 bg-background border shadow-md rounded-full px-4 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => setIsOpen(false)}
          >
            Timesheet
            <Clock className="h-4 w-4" />
          </Link>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
      >
        <Plus
          className={`h-6 w-6 transition-transform ${isOpen ? "rotate-45" : ""}`}
        />
      </button>
    </div>
  );
}
