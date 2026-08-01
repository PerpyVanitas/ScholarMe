/**
 * System Health & Telemetry API Endpoint
 * 
 * Inspects database connectivity, environment variable readiness, and uptime metrics.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const startTime = Date.now();
  let dbOk = false;
  let dbLatency = 0;

  try {
    const supabase = await createClient();
    const dbStart = Date.now();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    dbLatency = Date.now() - dbStart;
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  const envOk = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const isHealthy = dbOk && envOk;
  const status = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      checks: {
        database: { status: dbOk ? "ok" : "error", latencyMs: dbLatency },
        environment: { status: envOk ? "ok" : "missing_vars" },
      },
    },
    { status }
  );
}
