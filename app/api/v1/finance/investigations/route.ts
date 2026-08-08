import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const InvestigationSchema = z.object({
  flag_id: z.string().uuid().optional(),
  report_id: z.string().uuid().optional(),
  investigator_id: z.string().uuid().optional(),
  recommendation: z.string().optional(),
  meeting_notes: z.string().optional(),
  status: z.enum(["ongoing", "recommendation_submitted", "closed"]).default("ongoing"),
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

    const { data: cases, error } = await supabase
      .from("finance_investigations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch investigation cases" }, { status: 500 });
    }

    return NextResponse.json({ cases }, { status: 200 });
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
    const parseResult = InvestigationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { flag_id, report_id, investigator_id, recommendation, meeting_notes, status } = parseResult.data;

    // Enforce Policy Section XIV: Appeals must be submitted within 3 calendar days of flag issuance
    if (flag_id) {
      const { data: flagData } = await supabase
        .from("finance_compliance_flags")
        .select("date_issued, created_at")
        .eq("id", flag_id)
        .single();

      if (flagData) {
        const flagTime = new Date(flagData.date_issued || flagData.created_at).getTime();
        const diffDays = (Date.now() - flagTime) / (1000 * 60 * 60 * 24);
        if (diffDays > 3) {
          return NextResponse.json(
            {
              error:
                "Appeal window expired. Section XIV requires appeals to be filed within three (3) calendar days of flag issuance.",
            },
            { status: 400 },
          );
        }
      }
    }

    const case_number = `INV-${Date.now().toString().slice(-6)}`;

    const { data: investigationCase, error } = await supabase
      .from("finance_investigations")
      .insert({
        case_number,
        flag_id: flag_id || null,
        report_id: report_id || null,
        investigator_id: investigator_id || user.id,
        recommendation: recommendation || null,
        meeting_notes: meeting_notes || null,
        status,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create investigation case" }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Investigation case created", case: investigationCase },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
