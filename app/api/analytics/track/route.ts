import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, properties, page } = body as {
      event?: string;
      properties?: Record<string, unknown>;
      page?: string;
    };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const action = page ? `page_view:${page}` : event || "unknown";
    const metadata = properties || {};

    if (!user) {
      return NextResponse.json({ success: true });
    }

    await supabase.from("analytics_logs").insert({
      user_id: user.id,
      action,
      entity_type: page ? "page" : "event",
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
