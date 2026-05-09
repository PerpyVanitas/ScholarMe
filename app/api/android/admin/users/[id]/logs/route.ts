import { createAdminClient } from "@/lib/supabase/create-client";
import { validateAdmin } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await validateAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await params;

    const supabase = await createAdminClient();
    
    const { data: logs, error } = await supabase
      .from("analytics_logs")
      .select("id, user_id, action, entity_type, entity_id, details, created_at")
      .or(`user_id.eq.${id},entity_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const formatted = (logs ?? []).map((l: any) => ({
      id: l.id,
      userId: l.user_id,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details),
      timestamp: l.created_at
    }));

    return NextResponse.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("[Android Admin API] Audit logs error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch audit logs" }, { status: 500 });
  }
}
