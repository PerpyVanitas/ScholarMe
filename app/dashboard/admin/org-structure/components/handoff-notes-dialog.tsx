"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OfficerHandoffNote, Profile } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileText, Plus, History, Clock } from "lucide-react";
import { toast } from "sonner";

interface HandoffNotesDialogProps {
  positionKey: string;
  positionTitle: string;
  currentUserId: string;
}

export function HandoffNotesDialog({
  positionKey,
  positionTitle,
  currentUserId,
}: HandoffNotesDialogProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<OfficerHandoffNote[]>([]);
  const [content, setContent] = useState("");
  const [keyContacts, setKeyContacts] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please enter handoff note content.");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from("officer_handoff_notes").insert({
        position_key: positionKey,
        author_id: currentUserId,
        content: content.trim(),
        key_contacts: keyContacts.trim() || null,
      });

      if (error) throw error;
      toast.success("Officer handoff note logged successfully!");
      setContent("");
      setKeyContacts("");

      // Refresh list
      const { data } = await supabase
        .from("officer_handoff_notes")
        .select("*, author:author_id(full_name, email)")
        .eq("position_key", positionKey)
        .order("created_at", { ascending: false });
      setNotes(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save handoff note";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs">
          <FileText className="h-3.5 w-3.5" /> Handoff Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Handoff Notes — {positionTitle}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Institutional continuity notes left by outgoing officers for their successors.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* New Handoff Form */}
          <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Plus className="h-3.5 w-3.5 text-primary" /> Log Successor Handoff Note
            </h4>
            <Textarea
              placeholder="What's in progress, ongoing initiatives, key guidelines, things to watch for..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="text-xs"
            />
            <Input
              placeholder="Key Contacts (e.g. Faculty advisers, vendor emails, partner orgs)..."
              value={keyContacts}
              onChange={(e) => setKeyContacts(e.target.value)}
              className="text-xs"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSubmit} disabled={submitting} className="text-xs">
                {submitting ? "Saving..." : "Save Handoff Note"}
              </Button>
            </div>
          </div>

          {/* Institutional History Feed */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Position Handoff History ({notes.length})
            </h4>
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading notes...</p>
            ) : notes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No handoff notes logged for this position yet.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg border bg-card text-xs space-y-2">
                    <div className="flex justify-between items-center text-muted-foreground border-b pb-1">
                      <span className="font-semibold text-foreground">
                        Author: {(note.author as unknown as Profile)?.full_name || "Outgoing Officer"}
                      </span>
                      <span className="text-[10px] flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                    {note.key_contacts && (
                      <div className="p-2 rounded bg-muted/40 text-[11px] text-muted-foreground">
                        <strong>Key Contacts:</strong> {note.key_contacts}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
