"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ZoomIn } from "lucide-react";
import { Card } from "@/components/ui/card";

export function CampusMapModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MapPin className="mr-2 h-4 w-4" />
          Campus Map
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-2 sm:p-6 overflow-hidden flex flex-col h-[90vh]">
        <DialogHeader className="flex-shrink-0 px-4 pt-4 sm:p-0">
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Campus Vicinity Map
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto mt-4 rounded-xl border bg-muted/30 relative">
          <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm text-xs text-muted-foreground font-medium pointer-events-none">
            <ZoomIn className="h-3.5 w-3.5" />
            Scroll to pan, pinch to zoom
          </div>
          
          {/* We use a large minimum width so the map is highly detailed and requires scrolling on smaller screens */}
          <div className="min-w-[800px] h-full relative flex items-center justify-center p-4">
            <div className="relative w-full max-w-3xl aspect-[3/4] sm:aspect-auto sm:h-full">
              <Image 
                src="/campus-map.png"
                alt="ScholarMe Campus Map"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 1200px"
                priority
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
