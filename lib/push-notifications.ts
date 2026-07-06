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

export async function sendPushNotification(userId: string, payload: any) {
  if (!publicVapidKey || !privateVapidKey) {
    console.warn("VAPID keys not configured, skipping push notification.");
    return false;
  }

  const supabase = await createClient();

  // Assume a push_subscriptions table exists to map users to their web-push endpoints
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", userId);

  if (error || !subscriptions || subscriptions.length === 0) {
    return false;
  }

  const promises = subscriptions.map((sub) =>
    webpush
      .sendNotification(sub.subscription, JSON.stringify(payload))
      .catch((err) => {
        console.error(
          "Error sending push notification, might be expired:",
          err,
        );
        // Optional: Delete expired subscription from DB
      }),
  );

  await Promise.all(promises);
  return true;
}
