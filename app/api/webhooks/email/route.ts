import { handleApiError } from "@/lib/utils/api-error";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const emailLimiter = rateLimit({ interval: 60 * 60 * 1000, limit: 10 }); // 10 emails per hour per user

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // In a real scenario, this could be authenticated by a webhooks secret
    // For now, we secure it by user session
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rlResult = await emailLimiter.check(`email_${user.id}`);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // Role check to prevent open-relay
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();

    const roleName = Array.isArray(profile?.roles)
      // @ts-ignore: Strict unknown type check
      ? (profile?.roles as unknown[])[0]?.name
      : (profile?.roles as any)?.name;

    // Only allow admins or officers
    const allowedRoles = [
      "super_admin",
      "administrator",
      "president",
      "vice_president",
      "secretary",
      "treasurer",
      "auditor",
      "committee_head",
      "assistant_committee_head",
    ];
    if (!roleName || !allowedRoles.includes(roleName)) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions to relay email" },
        { status: 403 },
      );
    }

    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await sendEmail({ to, subject, html });

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email queued for delivery",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
