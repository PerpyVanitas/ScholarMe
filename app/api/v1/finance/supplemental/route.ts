import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const SupplementalSchema = z.object({
  parent_request_id: z.string().uuid(),
  variance_amount: z.number().positive(),
  justification: z.string().min(5),
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
    const parseResult = SupplementalSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { parent_request_id, variance_amount, justification } = parseResult.data;

    // Fetch parent budget request to compute variance %
    const { data: parentRequest, error: parentError } = await supabase
      .from("finance_budget_requests")
      .select("id, amount")
      .eq("id", parent_request_id)
      .single();

    if (parentError || !parentRequest) {
      return NextResponse.json(
        { error: "Parent budget request not found" },
        { status: 404 }
      );
    }

    const originalAmount = Number(parentRequest.amount) || 1;
    const variancePercentage = (variance_amount / originalAmount) * 100;

    const { data: supplemental, error: insertError } = await supabase
      .from("finance_supplemental_requests")
      .insert({
        parent_request_id,
        variance_amount,
        variance_percentage: Math.round(variancePercentage * 100) / 100,
        justification,
        submitted_by: user.id,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create supplemental budget request" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Supplemental budget request created",
        supplemental,
        requires_supplemental_approval: variancePercentage > 10,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
