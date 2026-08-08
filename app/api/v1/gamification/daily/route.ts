import { handleApiError } from "@/lib/utils/api-error";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { processDailyDecay } from "@/lib/gamification/daily-decay";
import { processDailyCheckin } from "@/lib/gamification/daily-checkin";

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

    // Process inactivity XP decay first
    const decayResult = await processDailyDecay(supabase, user.id);

    // Process daily check-in (streak count & daily XP reward)
    const checkinResult = await processDailyCheckin(supabase, user.id);

    return NextResponse.json({
      ...checkinResult,
      decay: decayResult,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return handleApiError(msg);
  }
}
