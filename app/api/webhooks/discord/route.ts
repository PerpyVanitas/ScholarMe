import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/create-client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, payload } = body;

    // We expect the Discord webhook URL to be stored in the environment
    const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

    if (!DISCORD_WEBHOOK_URL) {
      return NextResponse.json(
        { error: "Discord webhook URL is not configured." },
        { status: 500 },
      );
    }

    const discordMessage = {
      content: "System Notification",
      embeds: [] as any[],
    };

    if (type === "NEW_USER_SIGNUP") {
      discordMessage.content = "🎉 **New User Registered!**";
      discordMessage.embeds.push({
        title: "User Details",
        color: 3066993, // Green
        fields: [
          { name: "Name", value: payload.name || "Unknown", inline: true },
          { name: "Email", value: payload.email || "Unknown", inline: true },
          {
            name: "Program",
            value: payload.program || "Not specified",
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      });
    } else if (type === "NEW_ANNOUNCEMENT") {
      discordMessage.content = "📢 **New Facility Announcement**";
      discordMessage.embeds.push({
        title: payload.title || "Announcement",
        description: payload.description || "No description provided.",
        color: 3447003, // Blue
        timestamp: new Date().toISOString(),
      });
    } else if (type === "NEW_RESOURCE_ADDED") {
      discordMessage.content = "📚 **New Resource Available!**";
      discordMessage.embeds.push({
        title: payload.title || "Resource",
        color: 15105570, // Orange
        timestamp: new Date().toISOString(),
      });
    } else {
      // Generic fallback
      discordMessage.content = "🔔 **System Alert**";
      discordMessage.embeds.push({
        description: JSON.stringify(payload, null, 2),
        color: 9807270, // Grey
        timestamp: new Date().toISOString(),
      });
    }

    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(discordMessage),
    });

    if (!discordResponse.ok) {
      throw new Error(`Discord API responded with ${discordResponse.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Discord Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
