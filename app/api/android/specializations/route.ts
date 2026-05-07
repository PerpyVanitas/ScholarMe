import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

/** GET /api/android/specializations — list all specializations */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("specializations")
      .select("id, name, description, category")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { specializations: data ?? [] },
    });
  } catch (error) {
    console.error("[Android Specializations] GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch specializations" } },
      { status: 500 }
    );
  }
}
