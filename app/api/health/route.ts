import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    // Simple query to verify DB connection
    const { data, error } = await supabase.from("profiles").select("id").limit(1);

    if (error) {
      return NextResponse.json({ status: "error", message: "Database connection failed", error: error.message }, { status: 503 });
    }

    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error: unknown) {
    // @ts-expect-error TODO: Strict unknown type check
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
