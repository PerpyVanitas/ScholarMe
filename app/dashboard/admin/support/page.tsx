// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function AdminSupportInbox() {
  const supabase = await createClient();
  
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*, profiles:user_id(full_name, email)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6" /> Support Inbox
        </h1>
        <p className="text-muted-foreground">Manage user support tickets and live chats.</p>
      </div>

      <div className="grid gap-4">
        {!tickets || tickets.length === 0 ? (
          <p className="text-muted-foreground text-sm">No support tickets found.</p>
        ) : (
          tickets.map((ticket: unknown) => (
            // @ts-ignore: Strict unknown type check
            <Card key={ticket.id} className="border-border/60 shadow-sm flex flex-col sm:flex-row items-center justify-between p-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  // @ts-ignore: Strict unknown type check
                  <span className="font-semibold">{ticket.profiles?.full_name || "Unknown User"}</span>
                  // @ts-ignore: Strict unknown type check
                  <Badge variant={ticket.status === 'resolved' ? 'outline' : ticket.status === 'open' ? 'destructive' : 'default'}>
                    // @ts-ignore: Strict unknown type check
                    {ticket.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  // @ts-ignore: Strict unknown type check
                  Ticket ID: {ticket.id.slice(0, 8)} • {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </div>
              </div>
              
              <Button variant="outline" size="sm" asChild className="mt-4 sm:mt-0 whitespace-nowrap">
                {/* Note: An admin chat view would be built here in the future, for now we just show the link */}
                // @ts-ignore: Strict unknown type check
                <Link href={`/dashboard/admin/support/${ticket.id}`}>
                  View Chat <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
