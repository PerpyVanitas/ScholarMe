import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CollectionSchema = z.object({
  source: z.string().min(2),
  amount: z.number().positive(),
  officer_2_id: z.string().uuid(),
  deposit_reference: z.string().optional(),
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

    const { data: collections, error } = await supabase
      .from("finance_revenue_collections")
      .select("*, officer1:officer_1_id(full_name), officer2:officer_2_id(full_name)")
      .order("date_collected", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
    }

    return NextResponse.json({ collections }, { status: 200 });
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
    const parseResult = CollectionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { source, amount, officer_2_id, deposit_reference } = parseResult.data;

    // Dual-officer count validation check
    if (user.id === officer_2_id) {
      return NextResponse.json(
        { error: "Dual verification requires two different authorized officers" },
        { status: 400 }
      );
    }

    const collection_number = `REV-${Date.now().toString().slice(-6)}`;

    const { data: collection, error } = await supabase
      .from("finance_revenue_collections")
      .insert({
        collection_number,
        source,
        amount,
        officer_1_id: user.id,
        officer_2_id,
        deposited: !!deposit_reference,
        deposit_reference: deposit_reference || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to record collection" }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Revenue collection logged with dual verification", collection },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
