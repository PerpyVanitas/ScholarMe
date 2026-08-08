import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const VerificationSchema = z.object({
  target_type: z.enum(["petty_cash", "collections"]),
  expected_amount: z.number(),
  actual_count: z.number(),
  variance: z.number(),
  notes: z.string().optional(),
});

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
    const parseResult = VerificationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { target_type, expected_amount, actual_count, variance, notes } = parseResult.data;

    // Log surprise verification entry to finance audit log / flags if variance exists
    if (variance !== 0) {
      // Auto-issue a compliance flag for cash count variance per Spec 11.1
      await supabase.from("finance_compliance_flags").insert({
        officer_id: user.id,
        flag_level: Math.abs(variance) > 500 ? "orange" : "yellow",
        reason: `[SURPRISE CASH AUDIT DISCREPANCY] Fund: ${target_type.toUpperCase()}, Variance: ₱${variance.toFixed(2)}. ${notes || ""}`,
        issued_by: user.id,
        status: "active",
      });
    }

    return NextResponse.json(
      {
        message: "Surprise cash verification recorded successfully",
        data: { target_type, expected_amount, actual_count, variance },
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
