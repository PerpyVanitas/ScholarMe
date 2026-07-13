import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/create-client";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    // Authenticate via CRON_SECRET to prevent unauthorized triggering
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createAdminClient();

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let remindersSent = 0;
    let overdueNoticesSent = 0;
    let rolesReverted = 0;
    const errors: { message: string; detail?: string }[] = [];

    // 0. Auto-expire org roles — revert users whose role_expires_at is in the past
    //    but only if their role is an org role (not a system role like administrator/super_admin)
    const ORG_ROLES = [
      "president",
      "vice_president",
      "secretary",
      "treasurer",
      "auditor",
      "committee_head",
      "assistant_committee_head",
    ];

    const { data: expiredRoles, error: expiredError } = await supabase
      .from("profiles")
      .select("id, roles(name)")
      .lt("role_expires_at", now.toISOString())
      .not("role_expires_at", "is", null);

    if (expiredError) {
      console.error("Error fetching expired roles:", expiredError);
      errors.push(expiredError);
    } else if (expiredRoles && expiredRoles.length > 0) {
      // Get tutor role id
      const { data: tutorRole } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "tutor")
        .single();

      if (tutorRole) {
        for (const profile of expiredRoles) {
          const roleName = Array.isArray(profile.roles)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? (profile.roles as any[])[0]?.name
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : (profile.roles as any)?.name;

          // Only revert org roles — never touch system roles
          if (ORG_ROLES.includes(roleName)) {
            const { error: revertError } = await supabase
              .from("profiles")
              .update({ role_id: tutorRole.id, role_expires_at: null })
              .eq("id", profile.id);

            if (!revertError) {
              rolesReverted++;
              console.log(
                `Reverted expired org role '${roleName}' for profile ${profile.id}`,
              );
            }
          }
        }
      }
    }

    // 1. Event RSVP Reminders
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from("facility_events")
      .select(
        `
        id, 
        title, 
        start_time,
        event_rsvps (
          status,
          profiles (
            email,
            full_name
          )
        )
      `,
      )
      .gt("start_time", now.toISOString())
      .lt("start_time", tomorrow.toISOString());

    if (eventsError) {
      console.error("Error fetching upcoming events:", eventsError);
      errors.push(eventsError);
    } else if (upcomingEvents) {
      for (const event of upcomingEvents) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const goingRsvps = (event.event_rsvps || []).filter((r: any) => {
          const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          return r.status === "going" && p?.email;
        });

        for (const rsvp of goingRsvps) {
          const profile = Array.isArray(rsvp.profiles)
            ? rsvp.profiles[0]
            : rsvp.profiles;
          const eventDate = new Date(event.start_time).toLocaleString();

          const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Upcoming Event Reminder</h2>
              <p>Hi ${profile.full_name},</p>
              <p>This is a reminder that you RSVP'd "Going" to <strong>${event.title}</strong>.</p>
              <p><strong>When:</strong> ${eventDate}</p>
              <p>We look forward to seeing you there!</p>
              <p>- The ScholarMe Team</p>
            </div>
          `;

          const res = await sendEmail({
            to: profile.email,
            subject: `Reminder: ${event.title} is coming up!`,
            html: emailHtml,
          });

          if (res.success) {
            remindersSent++;
          } else {
            console.error(`Failed to send event reminder to ${profile.email}`);
          }
        }
      }
    }

    // 2. Overdue Book Reminders
    const { data: overdueCheckouts, error: checkoutsError } = await supabase
      .from("resource_checkouts")
      .select(
        `
        id,
        due_date,
        profiles (
          email,
          full_name
        ),
        physical_resources (
          title
        )
      `,
      )
      .eq("status", "active")
      .lt("due_date", now.toISOString());

    if (checkoutsError) {
      console.error("Error fetching overdue checkouts:", checkoutsError);
      errors.push(checkoutsError);
    } else if (overdueCheckouts && overdueCheckouts.length > 0) {
      // Update statuses to overdue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const overdueIds = overdueCheckouts.map((c: any) => c.id);

      const { error: updateError } = await supabase
        .from("resource_checkouts")
        .update({ status: "overdue" })
        .in("id", overdueIds);

      if (updateError) {
        console.error("Error updating overdue statuses:", updateError);
        errors.push(updateError);
      } else {
        // Send emails
        for (const checkout of overdueCheckouts) {
          const profile = Array.isArray(checkout.profiles)
            ? checkout.profiles[0]
            : checkout.profiles;
          const resource = Array.isArray(checkout.physical_resources)
            ? checkout.physical_resources[0]
            : checkout.physical_resources;
          const resourceTitle = resource?.title || "Library Resource";
          const dueDate = new Date(checkout.due_date).toLocaleDateString();

          const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
              <h2 style="color: #ef4444;">Overdue Resource Notice</h2>
              <p>Hi ${profile?.full_name || "Student"},</p>
              <p>Our records show that the following resource you checked out is now overdue:</p>
              <div style="background-color: #f8fafc; padding: 12px; border-left: 4px solid #ef4444; margin: 16px 0;">
                <strong>${resourceTitle}</strong><br/>
                Due Date: ${dueDate}
              </div>
              <p>Please return this item to the tutoring center as soon as possible to avoid any penalties.</p>
              <p>Thank you,<br/>The ScholarMe Team</p>
            </div>
          `;

          if (profile?.email) {
            const res = await sendEmail({
              to: profile.email,
              subject: `Overdue Notice: ${resourceTitle}`,
              html: emailHtml,
            });

            if (res.success) {
              overdueNoticesSent++;
            } else {
              console.error(
                `Failed to send overdue notice to ${profile.email}`,
              );
            }
          }
        }
      }
    }

    // 3. Discord Digest
    if (remindersSent > 0 || overdueNoticesSent > 0 || rolesReverted > 0) {
      const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
      if (DISCORD_WEBHOOK_URL) {
        const discordMessage = {
          content: "🤖 **Cron Job Completed: Reminders & Notices**",
          embeds: [
            {
              title: "Summary Report",
              color: 3447003, // Blue
              fields: [
                {
                  name: "Event Reminders Sent",
                  value: remindersSent.toString(),
                  inline: true,
                },
                {
                  name: "Overdue Notices Sent",
                  value: overdueNoticesSent.toString(),
                  inline: true,
                },
                {
                  name: "Org Roles Reverted",
                  value: rolesReverted.toString(),
                  inline: true,
                },
              ],
              timestamp: new Date().toISOString(),
            },
          ],
        };

        try {
          await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(discordMessage),
          });
        } catch (discordErr) {
          console.error("Failed to post discord digest:", discordErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      overdueNoticesSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    console.error("Reminders Cron Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
