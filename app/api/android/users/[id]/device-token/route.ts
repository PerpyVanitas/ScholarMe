import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-errors";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getBearerToken(request);
    
    if (!token) {
      return NextResponse.json(
        createErrorResponse("AUTH_002_INVALID_TOKEN", "Missing token"),
        { status: 401 }
      );
    }

    const { token: deviceToken, platform } = await request.json();

    if (!deviceToken || !platform) {
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

    const supabase = createSupabaseForBearer(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || user.id !== id) {
      return NextResponse.json(
        createErrorResponse("AUTH_002_SESSION_EXPIRED", "Session expired or user mismatch"),
        { status: 401 }
      );
    }

    // Insert or update device token
    const { data, error } = await supabase
      .from("device_tokens")
      .upsert(
        {
          user_id: user.id,
          token: deviceToken,
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
