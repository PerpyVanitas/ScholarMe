import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/create-client";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const supabase = await createAdminClient();

    // In production, you would authenticate this endpoint via a secure secret
    // e.g. const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let remindersSent = 0;
    let overdueNoticesSent = 0;
    const errors: any[] = [];

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
    if (remindersSent > 0 || overdueNoticesSent > 0) {
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
  } catch (error: any) {
    console.error("Reminders Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
