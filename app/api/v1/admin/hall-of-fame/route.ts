import { handleApiError } from "@/lib/utils/api-error";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod"; // Added Zod import

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Define schema for URL search parameters
    const GetHallOfFameSchema = z.object({
      start_date: z.string().nonempty("start_date is required"),
      end_date: z.string().nonempty("end_date is required"),
    });

    const { searchParams } = new URL(request.url);
    // Convert URLSearchParams to a plain object for Zod validation
    const params = Object.fromEntries(searchParams.entries());

    const parsedParams = GetHallOfFameSchema.safeParse(params);

    if (!parsedParams.success) {
      // Return a 400 response with a generic "Invalid input" error
      // The specific Zod errors can be logged or returned for debugging if needed.
      console.error("Validation error:", parsedParams.error);
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { start_date, end_date } = parsedParams.data;

    // Verify user is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();
    const rawRole = profile?.roles;
    const roleName = Array.isArray(rawRole)
      ? rawRole[0]?.name
      : (rawRole as { name: string } | undefined)?.name;
    if (!["administrator", "super_admin"].includes(roleName as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Call the new RPC
    const { data, error } = await supabase.rpc("get_hall_of_fame", {
      timeframe_start: start_date,
      timeframe_end: end_date,
    });

    if (error) {
      return handleApiError(error);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
