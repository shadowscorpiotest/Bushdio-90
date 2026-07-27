/* LifeHub service worker.

   Update policy: the app shell (HTML/JS/CSS) is fetched NETWORK-FIRST so a new version lands on the
   very next launch instead of the one after it — cache-first here meant every deploy was invisible
   for one launch, which made the app look broken after a fix. A short timeout falls back to the
   cached copy, so a slow or dead connection still opens instantly and offline still works.
   Icons are cache-first: they're the heavy part and they almost never change. */
const VERSION = "v4";
const CACHE = "lifehub-" + VERSION;
const NET_TIMEOUT = 4000;

const SHELL = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest"];
const ICONS = ["./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled([...SHELL, ...ICONS].map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* keep a fresh copy for offline use, but never let a cache write break the response */
function store(req, res) {
  if (res && res.status === 200 && res.type !== "opaque") {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
  }
  return res;
}

/* network-first with a timeout: whichever answers first wins, and the network still refreshes cache */
function networkFirst(req, fallbackKey) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (r) => { if (!settled && r) { settled = true; resolve(r); } };
    const fromCache = () => caches.match(req).then((c) => c || (fallbackKey ? caches.match(fallbackKey) : null));

    const timer = setTimeout(() => { fromCache().then(finish); }, NET_TIMEOUT);

    fetch(req)
      .then((res) => { clearTimeout(timer); finish(store(req, res)); })
      .catch(() => {
        clearTimeout(timer);
        fromCache().then((c) => finish(c || new Response("", { status: 504, statusText: "offline" })));
      });
  });
}

/* cache-first with a background refresh — for assets whose content is stable */
function cacheFirst(req) {
  return caches.match(req).then((cached) => {
    const network = fetch(req).then((res) => store(req, res)).catch(() => cached);
    return cached || network;
  });
}

/* A push from the server. The payload carries only what the lock screen shows — a title, a line and
   which section to open — because that is all the server is ever given.
   `userVisibleOnly` was promised at subscribe time, so every push MUST show something: if the
   payload is missing or unreadable we still show a generic card rather than silently swallowing it,
   which is what gets a site's push permission revoked by the browser. */
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : "" }; }
  const title = d.title || "🌿 LifeHub";
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || "Something's due.",
    tag: d.tag || ("push-" + (d.at || Date.now())),
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    data: { nav: d.nav || "" },
  }));
});

/* Browsers rotate a subscription without asking. If we don't re-register, reminders quietly stop
   working and nothing anywhere says so. */
self.addEventListener("pushsubscriptionchange", (e) => {
  e.waitUntil((async () => {
    try {
      const old = e.oldSubscription || await self.registration.pushManager.getSubscription();
      const key = (e.newSubscription && e.newSubscription.options && e.newSubscription.options.applicationServerKey)
        || (old && old.options && old.options.applicationServerKey);
      if (!key) return;
      const sub = e.newSubscription || await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      /* the page holds the credentials, so hand it over rather than duplicating auth in here */
      const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      list.forEach(c => c.postMessage({ type: "push-resub", sub: sub.toJSON ? sub.toJSON() : sub, old: old && old.endpoint }));
    } catch {}
  })());
});

/* Tapping a reminder should land you on the thing it was about: focus an open window and tell it
   where to go, or open one. */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const view = ((e.notification.data || {}).nav) || "";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) { try { c.postMessage({ type: "nav", view }); } catch {} return c.focus(); }
      }
      return self.clients.openWindow("./" + (view ? "#" + view : ""));
    })
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // let external lookups (Google Books / TMDb / Supabase / fonts) go straight to the network
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") { e.respondWith(networkFirst(req, "./index.html")); return; }

  // the parts that actually change between deploys
  if (/\.(?:js|css|webmanifest)$/.test(url.pathname)) { e.respondWith(networkFirst(req)); return; }

  e.respondWith(cacheFirst(req));
});
