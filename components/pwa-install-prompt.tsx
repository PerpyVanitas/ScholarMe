"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferredPrompt) return null;

  const handleInstallClick = async () => {
    setVisible(false);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-16 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="border-primary/40 bg-background/95 backdrop-blur shadow-lg">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">Install ScholarMe App</p>
              <p className="text-[11px] text-muted-foreground">Faster loading & offline access</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" onClick={handleInstallClick} className="h-7 text-xs px-2.5">
              Install
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setVisible(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
