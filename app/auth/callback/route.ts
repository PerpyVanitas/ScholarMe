/**
 * Auth Callback Route
 * Handles OAuth code exchange for Supabase authentication.
 * Redirects to dashboard on success or error page on failure.
 */
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { recordLoginHistory } from "@/lib/utils/login-history";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await recordLoginHistory(supabase, data.user.id, {
        user_agent: request.headers.get("user-agent") ?? undefined,
      });
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
