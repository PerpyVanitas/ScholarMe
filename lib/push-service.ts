import admin from "firebase-admin";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

// Initialize Firebase Admin (requires GOOGLE_APPLICATION_CREDENTIALS)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
}

// Initialize Web Push VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:support@scholarme.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Send push notification directly to a user's stored subscriptions.
 */
export async function sendUserPushNotification(
  userId: string,
  payload: NotificationPayload,
) {
  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicVapidKey || !privateVapidKey) {
    console.warn(
      "[Push] VAPID keys not configured, skipping push notification.",
    );
    return false;
  }

  const supabase = await createClient();
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("user_id", userId);

  if (error || !subscriptions || subscriptions.length === 0) {
    return false;
  }

  const expiredIds: string[] = [];
  const promises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        sub.subscription as never,
        JSON.stringify(payload),
      );
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 410 || status === 404) {
        expiredIds.push(sub.id);
      }
    }
  });

  await Promise.all(promises);

  if (expiredIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return true;
}

/**
 * Unified service to dispatch notifications to FCM and Web Push tokens.
 */
export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload,
  tokens: { fcm?: string[]; web?: unknown[] },
) {
  const results: Record<string, unknown> = { fcm: [], web: [] };

  if (tokens.fcm && tokens.fcm.length > 0) {
    try {
      const fcmResponse = await admin.messaging().sendEachForMulticast({
        tokens: tokens.fcm,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          url: payload.url || "",
        },
      });
      results.fcm = fcmResponse;
    } catch (error) {
      console.error("FCM Send error:", error);
    }
  }

  if (tokens.web && tokens.web.length > 0) {
    const webPromises = tokens.web.map((sub) =>
      webpush
        .sendNotification(sub as never, JSON.stringify(payload))
        .catch((err) => console.error("Web Push error for sub:", err)),
    );
    results.web = await Promise.all(webPromises);
  }

  return results;
}
