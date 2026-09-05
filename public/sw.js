/* Kroot service worker: push notifications + a tiny offline fallback.
   Deliberately minimal — pages are server-rendered per user, so we don't
   cache HTML; only the offline page and static icons. */

const CACHE = "kroot-static-v2";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png", "/icon.svg"];

// cache.addAll() was fatal here for anyone not on the default locale. The
// proxy redirects a bare "/offline" to "/<locale>/offline" (see src/proxy.ts),
// Cache.put refuses a redirected response, and addAll is all-or-nothing — so
// install rejected, the worker never activated, and those learners got no
// offline page *and* no push at all. Each entry is fetched and re-wrapped as a
// plain response on its own now, so one bad URL can't take the install down.
async function precache() {
  const cache = await caches.open(CACHE);
  await Promise.all(
    PRECACHE.map(async (url) => {
      try {
        const res = await fetch(url, { credentials: "same-origin" });
        if (!res.ok) return;
        await cache.put(url, new Response(await res.blob(), { status: 200, headers: res.headers }));
      } catch {
        // A single missing asset must not stop the worker from installing.
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Navigations: network first, offline page when the network is gone.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate") return;
  event.respondWith(
    fetch(req).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error()))
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Kroot", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Kroot 🌱";
  const options = {
    body: data.body || "Your tree is waiting for today's lesson.",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "kroot-reminder",
    renotify: false,
    data: { url: data.url || "/dashboard?source=push" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
