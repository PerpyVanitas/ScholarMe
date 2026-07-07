"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import { Card } from "@/components/ui/card";

export function CampusMapModal() {
  const [open, setOpen] = useState(false);

  // Hardcoded locations for the demo map
  const locations = [
    {
      id: "lib",
      name: "Main Library (Physical Resources)",
      x: 30,
      y: 40,
      desc: "Check out calculators and books here.",
    },
    {
      id: "tut",
      name: "Tutoring Center (Bldg A)",
      x: 70,
      y: 60,
      desc: "In-person sessions take place here.",
    },
    {
      id: "desk",
      name: "Admin Desk",
      x: 45,
      y: 80,
      desc: "Drop off forms and ask questions.",
    },
  ];

  const [activeLocation, setActiveLocation] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MapPin className="mr-2 h-4 w-4" />
          Campus Map
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Interactive Campus Map
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <div className="md:col-span-2 relative aspect-video bg-muted rounded-xl border overflow-hidden">
            {/* Fake SVG Map Background */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,var(--tw-colors-muted-foreground)_10%,transparent_10%,transparent_50%,var(--tw-colors-muted-foreground)_50%,var(--tw-colors-muted-foreground)_60%,transparent_60%,transparent_100%)] bg-[length:10px_10px] opacity-[0.03]" />
            <div className="absolute inset-4 border-2 border-dashed border-primary/20 rounded-lg pointer-events-none" />

            {/* Map Pins */}
            {locations.map((loc) => (
              <button
                key={loc.id}
                className={`absolute w-8 h-8 -ml-4 -mt-8 flex flex-col items-center justify-end transition-all ${activeLocation === loc.id ? "z-10 scale-110" : "hover:scale-105"}`}
                style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                onClick={() => setActiveLocation(loc.id)}
              >
                <div
                  className={`p-1.5 rounded-full shadow-lg text-white ${activeLocation === loc.id ? "bg-primary" : "bg-primary/70"}`}
                >
                  <MapPin className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase">
              Locations
            </h3>
            {locations.map((loc) => (
              <Card
                key={loc.id}
                className={`p-3 cursor-pointer transition-colors ${activeLocation === loc.id ? "border-primary bg-primary/5" : "hover:bg-accent/50"}`}
                onClick={() => setActiveLocation(loc.id)}
              >
                <div className="flex items-start gap-2">
                  <MapPin
                    className={`h-4 w-4 mt-0.5 ${activeLocation === loc.id ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p className="font-semibold text-sm leading-tight">
                      {loc.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {loc.desc}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
