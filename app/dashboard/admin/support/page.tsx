import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface SupportTicketItem {
  id: string;
  user_id: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority?: "urgent" | "high" | "medium" | "low";
  created_at: string;
  profiles?: { full_name?: string | null; email?: string | null } | null;
}

export default async function AdminSupportInbox() {
  const supabase = await createClient();
  
  const { data: rawTickets } = await supabase
    .from("support_tickets")
    .select("*, profiles:user_id(full_name, email)")
    .order("created_at", { ascending: false });

  const tickets = (rawTickets || []) as unknown as SupportTicketItem[];

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6" /> Support Inbox & SLA Triage
        </h1>
        <p className="text-muted-foreground">Manage user support tickets, SLA deadlines, and urgency queues.</p>
      </div>

      <div className="grid gap-4">
        {tickets.length === 0 ? (
          <p className="text-muted-foreground text-sm">No support tickets found.</p>
        ) : (
          tickets.map((ticket) => {
            const ticketAgeHours = (now - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60);
            const isSlaBreached = ticket.status === "open" && ticketAgeHours > 24;
            const priority = ticket.priority || (isSlaBreached ? "urgent" : ticket.status === "open" ? "high" : "medium");

            return (
              <Card key={ticket.id} className="border-border/60 shadow-sm flex flex-col sm:flex-row items-center justify-between p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{ticket.profiles?.full_name || "Unknown User"}</span>
                    <Badge variant={ticket.status === 'resolved' ? 'outline' : ticket.status === 'open' ? 'destructive' : 'default'}>
                      {ticket.status}
                    </Badge>
                    <Badge
                      className={
                        priority === "urgent"
                          ? "bg-red-600 text-white font-bold"
                          : priority === "high"
                            ? "bg-amber-500 text-white"
                            : "bg-blue-500 text-white"
                      }
                    >
                      {priority.toUpperCase()}
                    </Badge>
                    {isSlaBreached && (
                      <Badge variant="outline" className="border-red-500 text-red-600 bg-red-500/10 font-bold">
                        ⚠️ SLA BREACHED ({Math.round(ticketAgeHours)}h)
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ticket ID: {ticket.id.slice(0, 8)} • {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </div>
                </div>
                
                <Button variant="outline" size="sm" asChild className="mt-4 sm:mt-0 whitespace-nowrap">
                  <Link href={`/dashboard/admin/support/${ticket.id}`}>
                    View Chat <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
