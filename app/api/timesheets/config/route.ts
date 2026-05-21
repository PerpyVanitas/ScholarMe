import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("timesheet_periods")
      .select("id, name, start_date, end_date, is_active")
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.warn("Could not fetch active timesheet config (table might not exist yet):", error.message);
      return NextResponse.json({ id: null, name: null, start_date: null, end_date: null });
    }

    return NextResponse.json(data || { id: null, name: null, start_date: null, end_date: null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
