import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const bodyRaw = await request.json();

    const BodySchema = z.object({
      event: z.string().optional(),
      properties: z.record(z.string(), z.unknown()).optional(),
      page: z.string().optional(),
    });

    const parsedBody = BodySchema.safeParse(bodyRaw);

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { event, properties, page } = parsedBody.data;

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
