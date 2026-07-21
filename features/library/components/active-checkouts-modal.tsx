"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getActiveCheckouts, returnResource } from "../api/actions";
import { toast } from "sonner";
import { Loader2, BookOpen, Undo2 } from "lucide-react";
import { format } from "date-fns";

export function ActiveCheckoutsModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      load();
    }
  }, [open]);

  async function load() {
    setLoading(true);
    try {
      const data = await getActiveCheckouts();
      setCheckouts(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load active checkouts");
    } finally {
      setLoading(false);
    }
  }

  async function handleReturn(checkoutId: string) {
    setReturningId(checkoutId);
    try {
      await returnResource(checkoutId);
      toast.success("Resource returned successfully!");
      await load();
      // Optionally trigger an event to refresh catalog counts, though revalidatePath will handle the server state
    } catch (e: any) {
      toast.error(e.message || "Failed to return resource");
    } finally {
      setReturningId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Active Checkouts</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : checkouts.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No active checkouts found.</p>
            </div>
          ) : (
            checkouts.map((checkout) => (
              <div key={checkout.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{checkout.resource?.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Checked out by: <span className="font-medium text-foreground">{checkout.profile?.full_name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {format(new Date(checkout.due_date), "MMM d, yyyy")}
                    {new Date(checkout.due_date) < new Date() && (
                      <Badge variant="destructive" className="ml-2 scale-90">Overdue</Badge>
                    )}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleReturn(checkout.id)}
                  disabled={returningId === checkout.id}
                >
                  {returningId === checkout.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Undo2 className="h-4 w-4 mr-2" />}
                  Return
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
