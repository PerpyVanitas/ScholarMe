import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const IssueFlagSchema = z.object({
  officer_id: z.string().uuid(),
  flag_level: z.enum(["yellow", "orange", "red"]),
  reason: z.string().min(3),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: flags, error } = await supabase
      .from("finance_compliance_flags")
      .select("*, profiles:officer_id(full_name)")
      .order("date_issued", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch compliance flags" }, { status: 500 });
    }

    return NextResponse.json({ flags }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = IssueFlagSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { officer_id, flag_level, reason } = parseResult.data;

    const { data: flag, error } = await supabase
      .from("finance_compliance_flags")
      .insert({
        officer_id,
        flag_level,
        reason,
        issued_by: user.id,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to issue compliance flag" }, { status: 500 });
    }

    return NextResponse.json({ message: "Compliance flag issued successfully", flag }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
