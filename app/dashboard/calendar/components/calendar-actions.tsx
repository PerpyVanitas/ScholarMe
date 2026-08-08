"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { SyllabusParserModal } from "./syllabus-parser-modal";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

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
          logger.debug({ count: events.length }, "Events extracted from syllabus");
          toast.success(`Extracted ${events.length} events from syllabus`);
        }}
      />
    </>
  );
}
