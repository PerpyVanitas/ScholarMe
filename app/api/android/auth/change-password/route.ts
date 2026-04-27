import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

// Simple in-memory rate limiting for password changes
const passwordChangeAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 5;

function checkRateLimit(userId: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const record = passwordChangeAttempts.get(userId);

  if (!record || now > record.resetTime) {
    passwordChangeAttempts.set(userId, { count: 0, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((record.resetTime - now) / (60 * 1000));
    return {
      allowed: false,
      message: `Too many password change attempts. Try again in ${minutesLeft} minute(s).`,
    };
  }

  record.count++;
  return { allowed: true };
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid authorization token" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = await createClient();

    // Verify token and get user
    const { data, error: authError } = await supabase.auth.getUser(token);

    if (authError || !data.user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Check rate limit
    const rateCheck = checkRateLimit(data.user.id);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: rateCheck.message },
        { status: 429 }
      );
    }

    const { oldPassword, newPassword } = await request.json();

    // Validate input
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Old password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("[Android Auth] Password change error:", updateError);
      return NextResponse.json(
        {
          success: false,
          message: updateError.message || "Failed to change password",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("[Android Auth] Change password error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred",
        errorCode: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
