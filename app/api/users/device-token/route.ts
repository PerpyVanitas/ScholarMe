/** POST /api/users/device-token -- Register device token for push notifications */
import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    const { token, platform } = await request.json();

    if (!token || !platform) {
      return NextResponse.json(
        createErrorResponse("VALID_001_MISSING_REQUIRED_FIELD", "token and platform are required"),
        { status: 400 }
      );
    }

    if (!["ios", "android", "web"].includes(platform)) {
      return NextResponse.json(
        createErrorResponse("VALID_001_GENERAL", "platform must be ios, android, or web"),
        { status: 400 }
      );
    }

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
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        createErrorResponse("VALID_001_MISSING_REQUIRED_FIELD", "token is required"),
        { status: 400 }
      );
    }

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
