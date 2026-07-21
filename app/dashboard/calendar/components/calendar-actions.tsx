"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { SyllabusParserModal } from "./syllabus-parser-modal";

export function CalendarActions() {
  const [showParser, setShowParser] = useState(false);

  return (
    <>
      <Button onClick={() => setShowParser(true)} variant="outline" className="gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        Parse Syllabus with AI
      </Button>

      <SyllabusParserModal
        open={showParser}
        onOpenChange={setShowParser}
        onEventsExtracted={(events) => {
          // In a real implementation we would save these to the database
          // For now, it just shows them extracted in the console
          console.log("Events extracted:", events);
        }}
      />
    </>
  );
}
