"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

/**
 * A floating "scroll to top" button that appears after the user
 * scrolls more than 400px down the page.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-lg hover:bg-secondary/60 transition-all duration-200 hover:scale-110 active:scale-95"
    >
      <ChevronUp className="h-5 w-5 text-foreground" />
    </button>
  );
}
