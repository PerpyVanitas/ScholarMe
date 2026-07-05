/**
 * ScholarMe Service Worker
 * Handles offline caching and push notifications.
 */

const CACHE_NAME = "scholarme-cache-v1";
const DYNAMIC_CACHE = "scholarme-dynamic-v1";

const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip supabase/realtime websocket requests
  if (url.pathname.includes("/realtime/")) return;
  if (request.method !== "GET") return;

  // API Calls: Network First, then Cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const resClone = response.clone();
          caches
            .open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, resClone));
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Static Assets / Pages: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => {
          // If navigation fails, return offline page
          if (request.mode === "navigate") {
            return caches.match("/offline.html");
          }
        });
      return cachedResponse || fetchPromise;
    }),
  );
});

// Push Notifications
self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/",
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
