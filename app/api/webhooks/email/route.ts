import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // In a real scenario, this could be authenticated by a webhooks secret
    // For now, we secure it by user session
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    console.error("Email webhook error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
