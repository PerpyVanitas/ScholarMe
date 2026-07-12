import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "";

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    "mailto:admin@scholarme.com",
    publicVapidKey,
    privateVapidKey,
  );
}

export async function sendPushNotification(userId: string, payload: object) {
  if (!publicVapidKey || !privateVapidKey) {
    console.warn("VAPID keys not configured, skipping push notification.");
    return false;
  }

  const supabase = await createClient();

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("user_id", userId);

  if (error) {
    console.error("[Push] Failed to fetch subscriptions for user:", userId, error.message);
    return false;
  }

  if (!subscriptions || subscriptions.length === 0) {
    return false;
  }

  const expiredIds: string[] = [];

  const promises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
    } catch (err: unknown) {
      // webpush throws for expired/invalid subscriptions (410 Gone)
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 410 || status === 404) {
        // Mark this subscription for deletion
        expiredIds.push(sub.id);
      } else {
        console.error("[Push] Error sending notification:", err);
      }
    }
  });

  await Promise.all(promises);

  // Clean up expired subscriptions to prevent growing garbage in the table
  if (expiredIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", expiredIds);

    if (deleteError) {
      console.error("[Push] Failed to delete expired subscriptions:", deleteError.message);
    } else {
      console.log(`[Push] Cleaned up ${expiredIds.length} expired subscription(s) for user: ${userId}`);
    }
  }

  return true;
}
