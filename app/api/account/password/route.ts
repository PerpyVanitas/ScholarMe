// PUT /api/account/password -- change own password
import { createClient as createServerClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

// Simple in-memory rate limiting (resets per server restart)
const passwordChangeAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_ATTEMPTS = 5; // Max 5 attempts per hour

function checkRateLimit(userId: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const record = passwordChangeAttempts.get(userId);

  if (!record || now > record.resetTime) {
    // Reset or create new record
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

export async function PUT(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to change your password." },
        { status: 401 }
      );
    }

    // Check rate limit
    const rateCheck = checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.message }, { status: 429 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update password." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("[v0] Password change error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
