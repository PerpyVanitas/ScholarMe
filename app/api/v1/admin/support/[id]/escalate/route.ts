import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const escalateSchema = z.object({
  reason: z.string().min(5, "Escalation reason must be at least 5 characters"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();

    const roleName = (profile?.roles as unknown as { name: string })?.name;
    if (roleName !== "administrator" && roleName !== "super_admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const parseResult = escalateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    // Escalate ticket priority and assign to Super Admin queue
    const { error: updateError } = await supabase
      .from("support_tickets")
      .update({
        priority: "urgent",
        status: "escalated",
        assigned_to: null, // Unassigned for Super Admin pool
      })
      .eq("id", ticketId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to escalate ticket" }, { status: 500 });
    }

    // Log administrative escalation action
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "SUPPORT_TICKET_ESCALATED",
      details: { ticketId, reason: parseResult.data.reason },
    });

    return NextResponse.json({ success: true, message: "Ticket escalated to Super Admin review queue" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
