"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Accessibility, Eye, Type, Globe } from "lucide-react";
import { toast } from "sonner";

export function A11ySettings() {
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }

    if (dyslexiaFont) {
      document.documentElement.classList.add("dyslexia-font");
    } else {
      document.documentElement.classList.remove("dyslexia-font");
    }
  }, [highContrast, dyslexiaFont]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Accessibility Settings">
          <Accessibility className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Accessibility (a11y)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setHighContrast(!highContrast)}>
          <Eye className="mr-2 h-4 w-4" />
          <span>{highContrast ? "Disable" : "Enable"} High Contrast</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDyslexiaFont(!dyslexiaFont)}>
          <Type className="mr-2 h-4 w-4" />
          <span>{dyslexiaFont ? "Disable" : "Enable"} Dyslexia Font</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
