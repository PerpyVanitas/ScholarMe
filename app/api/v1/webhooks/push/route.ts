import { handleApiError } from "@/lib/utils/api-error";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const SubscriptionSchema = z.object({
      endpoint: z.string(),
    }).passthrough();

    const parseResult = SubscriptionSchema.safeParse(await req.json());

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const subscription = parseResult.data;

    // The original check `if (!subscription || !subscription.endpoint)` is now redundant
    // because the Zod schema enforces `subscription` to be an object with a string `endpoint`.

    // Upsert subscription into push_subscriptions table
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        subscription: subscription,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id, subscription->>endpoint",
      },
    );

    if (error) {
      return handleApiError(error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
