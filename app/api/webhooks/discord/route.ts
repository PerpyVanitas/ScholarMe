import { handleApiError } from "@/lib/utils/api-error";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/create-client";
import { z } from "zod";

// Zod schemas for request body validation
const newUserSignupPayloadSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(), // Added email validation
  program: z.string().optional(),
}).passthrough(); // Allow extra fields if they exist in the payload

const newAnnouncementPayloadSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
}).passthrough();

const newResourceAddedPayloadSchema = z.object({
  title: z.string().optional(),
}).passthrough();

// Main schema for the request body with dynamic payload validation
const requestBodySchema = z.object({
  type: z.string(),
  payload: z.any(), // Initially accept any payload, then refine based on 'type'
}).superRefine((data, ctx) => {
  // Dynamically validate `payload` based on the `type` field
  if (data.type === "NEW_USER_SIGNUP") {
    const parsedPayload = newUserSignupPayloadSchema.safeParse(data.payload);
    if (!parsedPayload.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid payload for type ${data.type}: ${parsedPayload.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
        path: ["payload"],
      });
    }
  } else if (data.type === "NEW_ANNOUNCEMENT") {
    const parsedPayload = newAnnouncementPayloadSchema.safeParse(data.payload);
    if (!parsedPayload.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid payload for type ${data.type}: ${parsedPayload.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
        path: ["payload"],
      });
    }
  } else if (data.type === "NEW_RESOURCE_ADDED") {
    const parsedPayload = newResourceAddedPayloadSchema.safeParse(data.payload);
    if (!parsedPayload.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid payload for type ${data.type}: ${parsedPayload.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
        path: ["payload"],
      });
    }
  }
  // For any other 'type', payload: z.any() is acceptable, so no further validation is needed here.
});

export async function POST(req: Request) {
  try {
    // Validate request body using Zod's safeParseAsync
    const parsedBody = await requestBodySchema.safeParseAsync(await req.json());

    if (!parsedBody.success) {
      // Return a 400 Bad Request response if validation fails
      // console.error("Request body validation failed:", parsedBody.error); // Optional: log errors for debugging
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Destructure validated data. 'payload' will be typed as 'any' but runtime-validated.
    const { type, payload } = parsedBody.data;

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
      embeds: [] as unknown[],
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
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
