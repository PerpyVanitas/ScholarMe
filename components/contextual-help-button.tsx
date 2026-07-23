"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { getHelpForRoute } from "@/lib/config/contextual-help-config";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HelpCircle, Info, CheckCircle2 } from "lucide-react";

export function ContextualHelpButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const helpInfo = getHelpForRoute(pathname);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Screen Help">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Screen Help</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md space-y-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-primary" /> {helpInfo.title}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground pt-1">
            Contextual guidance for {pathname}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pt-2">
          {/* Purpose Statement */}
          <div className="p-3 rounded-lg border bg-primary/5 text-xs text-foreground leading-relaxed">
            <strong>Screen Purpose:</strong> {helpInfo.purpose}
          </div>

          {/* Action List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Main Actions & Controls
            </h4>
            <div className="space-y-2">
              {helpInfo.actions.map((act, i) => (
                <div key={i} className="p-3 rounded-md border bg-card text-xs space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {act.name}
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-5">{act.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
