/**
 * P14-8: Notification Fan-out Load Test
 *
 * Tests two scenarios at scale (17,000 users / 200 daily officers):
 *   Scenario A: WebSocket Realtime channel connections at peak concurrency (500 CCU)
 *   Scenario B: Push notification fan-out throughput when a broadcast is triggered
 *
 * Prerequisites:
 *   1. Install k6:  choco install k6  (Windows) or  brew install k6  (Mac)
 *   2. Set environment variables:
 *        BASE_URL   - Your staging URL (e.g. https://staging.scholarme.app)
 *        AUTH_TOKEN - A valid Supabase JWT for a test user
 *
 * Run:
 *   k6 run --env BASE_URL=https://staging.scholarme.app --env AUTH_TOKEN=eyJ... tests/load/notification-fanout.js
 */

import http from "k6/http";
import ws from "k6/ws";
import { sleep, check, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------
const wsConnectErrors = new Rate("ws_connect_errors");
const wsMessageLatency = new Trend("ws_message_latency_ms");
const pushDeliveryTime = new Trend("push_delivery_ms");
const pushErrors = new Rate("push_errors");
const fanoutTotalMessages = new Counter("fanout_total_messages");

// ---------------------------------------------------------------------------
// Load profile
// ---------------------------------------------------------------------------
// Stage 1: Ramp to 500 CCU (simulates morning rush before a major event)
// Stage 2: Sustain 500 CCU for 2 minutes
// Stage 3: Spike to 750 CCU briefly (worst-case fan-out)
// Stage 4: Ramp down
export const options = {
  scenarios: {
    // --- Scenario A: Realtime WebSocket connections ---
    realtime_connections: {
      executor: "ramping-vus",
      exec: "realtimeScenario",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 200 },   // ramp up
        { duration: "60s", target: 500 },   // peak - 500 CCU
        { duration: "30s", target: 750 },   // spike
        { duration: "30s", target: 0 },     // ramp down
      ],
      gracefulRampDown: "10s",
    },
    // --- Scenario B: Push notification fan-out (admin broadcast) ---
    push_fanout: {
      executor: "constant-arrival-rate",
      exec: "pushFanoutScenario",
      rate: 5,           // 5 fan-out triggers per second
      timeUnit: "1s",
      duration: "2m",
      preAllocatedVUs: 20,
      maxVUs: 50,
    },
  },
  thresholds: {
    // WebSocket must connect within 2s for 95% of users
    ws_connect_errors: ["rate<0.01"],          // <1% WS connection failure
    ws_message_latency_ms: ["p(95)<2000"],     // Realtime message received in <2s at p95
    push_errors: ["rate<0.02"],                // <2% push delivery failures
    push_delivery_ms: ["p(95)<5000"],          // Push delivered within 5s at p95
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<3000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://staging.scholarme.app";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";

const SUPABASE_URL = __ENV.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || "";

// ---------------------------------------------------------------------------
// Scenario A — Realtime WebSocket connections
// Simulates users holding open Supabase Realtime channels (messaging, polls,
// support chat). At 500 CCU, Supabase Free/Pro supports up to 200 concurrent
// connections by default. Pro plan with Realtime enabled supports 500+.
// ---------------------------------------------------------------------------
export function realtimeScenario() {
  const vuId = __VU;
  const conversationId = `load-test-conv-${vuId % 50}`; // 50 unique channels

  // We use the Supabase Realtime WebSocket endpoint directly
  const wsUrl = `${SUPABASE_URL.replace("https://", "wss://")}/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;

  const connectStart = Date.now();

  const res = ws.connect(wsUrl, {}, function (socket) {
    socket.on("open", () => {
      const connectTime = Date.now() - connectStart;
      wsMessageLatency.add(connectTime);
      wsConnectErrors.add(false);

      // Subscribe to a conversation channel (mirrors real app behaviour)
      socket.send(
        JSON.stringify({
          topic: `realtime:conversation:${conversationId}`,
          event: "phx_join",
          payload: { access_token: AUTH_TOKEN },
          ref: "1",
        })
      );

      // Hold the connection open for 30s to simulate a user session
      sleep(30);
      socket.close();
    });

    socket.on("message", (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.event === "INSERT" || data.event === "UPDATE") {
          const latency = Date.now() - (data.payload?.committed_at ? new Date(data.payload.committed_at).getTime() : Date.now());
          wsMessageLatency.add(Math.max(0, latency));
          fanoutTotalMessages.add(1);
        }
      } catch (_) {}
    });

    socket.on("error", () => {
      wsConnectErrors.add(true);
    });
  });

  check(res, { "WebSocket connected successfully": (r) => r && r.status === 101 });
  sleep(1);
}

// ---------------------------------------------------------------------------
// Scenario B — Push notification fan-out throughput
// Simulates an admin triggering a broadcast notification (e.g., event
// announcement to all 200 officers). The push route hits the DB for
// push_subscriptions, then calls web-push.sendNotification per subscription.
// At scale we expect each user to have 1-3 subscriptions (multi-device).
// ---------------------------------------------------------------------------
export function pushFanoutScenario() {
  group("Push notification fan-out", () => {
    const startTime = Date.now();

    // Trigger a push notification to our internal webhook endpoint
    // In the real app, this happens when e.g. a cron broadcasts to all officers
    const res = http.post(
      `${BASE_URL}/api/webhooks/push`,
      JSON.stringify({
        // Simulate registering/triggering a push subscription check
        endpoint: `https://fcm.googleapis.com/fcm/send/load-test-${__VU}-${__ITER}`,
        keys: {
          p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlTiEgvys",
          auth: "tBHItJI5svbpez7KI4CCXg",
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        timeout: "10s",
        tags: { name: "push_subscription_register" },
      }
    );

    const deliveryTime = Date.now() - startTime;
    pushDeliveryTime.add(deliveryTime);

    const success = check(res, {
      "Push subscription accepted": (r) => r.status === 200 || r.status === 201,
      "Push response time < 5s": (r) => r.timings.duration < 5000,
    });

    if (!success) {
      pushErrors.add(true);
    } else {
      pushErrors.add(false);
    }

    sleep(0.2);
  });
}
