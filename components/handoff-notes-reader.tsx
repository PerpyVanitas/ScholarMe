"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OfficerHandoffNote } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, History, User, Clock, Contact } from "lucide-react";

interface HandoffNotesReaderProps {
  positionKey: string;
  positionTitle: string;
  triggerButton?: React.ReactNode;
}

export function HandoffNotesReader({
  positionKey,
  positionTitle,
  triggerButton,
}: HandoffNotesReaderProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<OfficerHandoffNote[]>([]);

  useEffect(() => {
    if (!open) return;
    async function loadNotes() {
      try {
        setLoading(true);
        const { data } = await supabase
          .from("officer_handoff_notes")
          .select("*, author:author_id(full_name, email)")
          .eq("position_key", positionKey)
          .order("created_at", { ascending: false });

        setNotes(data || []);
      } catch (err) {
        console.error("Error loading handoff notes:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNotes();
  }, [open, positionKey, supabase]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground">
            <FileText className="h-3.5 w-3.5" /> Read Transition Notes
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5 text-primary" /> Successor Continuity Notes — {positionTitle}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Historical operational advice, committee contacts, and handoff notes left by outgoing officers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Loading handoff notes...</div>
          ) : notes.length === 0 ? (
            <div className="p-8 text-center border rounded-lg bg-muted/20 text-xs text-muted-foreground">
              No historical handoff notes logged for this position yet.
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="p-4 rounded-lg border bg-card space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">
                        {note.author?.full_name || "Outgoing Officer"}
                      </span>
                      {note.author?.email && (
                        <Badge variant="outline" className="text-[10px]">{note.author.email}</Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(note.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">Operational Guidance & Notes:</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                  </div>

                  {note.key_contacts && (
                    <div className="p-2.5 rounded bg-muted/30 border text-[11px] space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        <Contact className="h-3.5 w-3.5 text-primary" /> Key Contacts & Stakeholders:
                      </div>
                      <p className="text-muted-foreground">{note.key_contacts}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
