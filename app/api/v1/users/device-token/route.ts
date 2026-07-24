import { z } from "zod";
/** POST /api/users/device-token -- Register device token for push notifications */
import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    const postBodySchema = z.object({
      token: z.string(),
      platform: z.enum(["ios", "android", "web"]),
    });

    const parseResult = postBodySchema.safeParse(await request.json());

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { token, platform } = parseResult.data;

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse("AUTH_002_SESSION_EXPIRED", "Session expired"),
        { status: 401 }
      );
    }

    // Insert or update device token
    const { data, error } = await supabase
      .from("device_tokens")
      .upsert(
        {
          user_id: user.id,
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,token" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        createErrorResponse("SYSTEM_001_INTERNAL_ERROR", "Failed to register device token"),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        message: "Device token registered successfully",
        data,
      })
    );
  } catch {
    return NextResponse.json(
      createErrorResponse("SYSTEM_001_UNKNOWN_ERROR", "An unexpected error occurred"),
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const deleteBodySchema = z.object({
      token: z.string(),
    });

    const parseResult = deleteBodySchema.safeParse(await request.json());

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { token } = parseResult.data;

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse("AUTH_002_SESSION_EXPIRED", "Session expired"),
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from("device_tokens")
      .delete()
      .match({ user_id: user.id, token });

    if (error) {
      return NextResponse.json(
        createErrorResponse("SYSTEM_001_INTERNAL_ERROR", "Failed to delete device token"),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ message: "Device token removed successfully" })
    );
  } catch {
    return NextResponse.json(
      createErrorResponse("SYSTEM_001_UNKNOWN_ERROR", "An unexpected error occurred"),
      { status: 500 }
    );
  }
}
