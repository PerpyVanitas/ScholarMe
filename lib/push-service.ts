import admin from 'firebase-admin';
import webpush from 'web-push';

// Initialize Firebase Admin (requires GOOGLE_APPLICATION_CREDENTIALS)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

// Initialize Web Push VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@scholarme.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Unified service to dispatch notifications to FCM and Web Push.
 */
export async function sendPushNotification(
  userId: string, 
  payload: NotificationPayload,
  tokens: { fcm?: string[]; web?: any[] }
) {
  const results: any = { fcm: [], web: [] };

  // 1. Send to Android via FCM
  if (tokens.fcm && tokens.fcm.length > 0) {
    try {
      const fcmResponse = await admin.messaging().sendEachForMulticast({
        tokens: tokens.fcm,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          url: payload.url || '',
        }
      });
      results.fcm = fcmResponse;
    } catch (error) {
      console.error('FCM Send error:', error);
    }
  }

  // 2. Send to Web via Web Push
  if (tokens.web && tokens.web.length > 0) {
    const webPromises = tokens.web.map(sub => 
      webpush.sendNotification(sub, JSON.stringify(payload))
        .catch(err => console.error('Web Push error for sub:', err))
    );
    results.web = await Promise.all(webPromises);
  }

  return results;
}
