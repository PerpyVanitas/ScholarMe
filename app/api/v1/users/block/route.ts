import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("/api/v1/users/block");

const BodySchema = z.object({
  blocked_id: z.string().uuid(),
});

/** POST /api/v1/users/block  — block a user */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { blocked_id } = parsed.data;
    if (blocked_id === user.id) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_blocks")
      .insert({ blocker_id: user.id, blocked_id });

    if (error && error.code !== "23505") {
      log.error({ error }, "Failed to block user");
      return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    log.error({ err }, "Unexpected error in block route");
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/** DELETE /api/v1/users/block  — unblock a user */
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { blocked_id } = parsed.data;

    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", blocked_id);

    if (error) {
      log.error({ error }, "Failed to unblock user");
      return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    log.error({ err }, "Unexpected error in unblock route");
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
