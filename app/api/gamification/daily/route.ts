import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { processDailyDecay } from "@/lib/gamification/daily-decay";

export async function POST(_req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processDailyDecay(supabase, user.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[gamification/daily] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
