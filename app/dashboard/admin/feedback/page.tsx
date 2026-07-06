"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface FeedbackItem {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  status: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeedback() {
      try {
        const response = await fetch("/api/admin/feedback");
        if (!response.ok) {
          throw new Error("Failed to fetch feedback");
        }
        const data = await response.json();
        setFeedback(data.data || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load feedback");
      } finally {
        setLoading(false);
      }
    }
    loadFeedback();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          User Feedback
        </h1>
        <p className="text-muted-foreground">
          View all feedback and bug reports submitted by users.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Feedback Logs</CardTitle>
          <CardDescription>
            Recent feedback submissions sorted by newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No feedback has been submitted yet.
            </div>
          ) : (
            <div className="space-y-6">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-4 border-b border-border/40 pb-6 last:border-0 last:pb-0"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={item.profiles?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {item.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {item.profiles?.full_name || "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(item.created_at),
                          "MMM d, yyyy h:mm a",
                        )}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {item.profiles?.email || "No email"}
                    </p>
                    <div className="text-sm bg-muted/30 p-3 rounded-md mt-2 whitespace-pre-wrap">
                      {item.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
