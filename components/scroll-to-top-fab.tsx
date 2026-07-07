"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ScrollToTopFab() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      let scrollTop = 0;
      if (target === document) {
        scrollTop = window.scrollY;
      } else {
        scrollTop = (target as HTMLElement).scrollTop;
      }
      setIsVisible(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Also try to scroll the main container if it's the one scrolling
    const scrollables = document.querySelectorAll(
      ".overflow-auto, .overflow-y-auto",
    );
    scrollables.forEach((el) => {
      el.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg border-primary/20 bg-background hover:bg-primary/10 transition-all duration-300 animate-in fade-in zoom-in"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-5 w-5 text-primary" />
          <span className="sr-only">Scroll to top</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Scroll to top</p>
      </TooltipContent>
    </Tooltip>
  );
}
