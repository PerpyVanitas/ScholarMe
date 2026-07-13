"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PageTutorialButton() {
  const handleStartTour = () => {
    // Dispatch custom event to trigger the tour
    const event = new CustomEvent("start-page-tour");
    window.dispatchEvent(event);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStartTour}
          className="rounded-full"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Page Tutorial</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Page Tutorial</p>
      </TooltipContent>
    </Tooltip>
  );
}
