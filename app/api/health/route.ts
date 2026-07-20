import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as Sentry from "@sentry/nextjs";
import { handleApiError } from "@/lib/utils/api-error";

export async function GET() {
  try {
    const supabase = await createClient();
    // Simple query to verify DB connection
    const { error } = await supabase.from("profiles").select("id").limit(1);

    if (error) {
      // Log the real DB error server-side; never expose it to the client
      Sentry.captureException(error, { tags: { route: "/api/health", check: "db_connectivity" } });
      console.error("[health] DB connectivity check failed:", error.message);
      return NextResponse.json(
        { status: "error", message: "Database connection failed" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        build: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
