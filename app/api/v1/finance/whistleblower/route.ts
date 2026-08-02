import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const ReportSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  is_anonymous: z.boolean().default(true),
  assigned_office: z
    .enum(["auditor", "president", "finance_committee", "adviser", "investigation_committee"])
    .default("auditor"),
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

    const { data: reports, error } = await supabase
      .from("finance_whistleblower_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch whistleblower reports" }, { status: 500 });
    }

    // Mask submitted_by for anonymous reports
    const maskedReports = reports.map((r) => ({
      ...r,
      submitted_by: r.is_anonymous ? null : r.submitted_by,
    }));

    return NextResponse.json({ reports: maskedReports }, { status: 200 });
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
    const parseResult = ReportSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, is_anonymous, assigned_office } = parseResult.data;
    const report_number = `WB-${Date.now().toString().slice(-6)}`;

    const { data: report, error } = await supabase
      .from("finance_whistleblower_reports")
      .insert({
        report_number,
        title,
        description,
        is_anonymous,
        assigned_office,
        submitted_by: is_anonymous ? null : user.id,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Whistleblower report submitted confidentially", report },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
