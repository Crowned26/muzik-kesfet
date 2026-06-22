const CACHE = "mk-v6";
const SHELL = ["/", "/static/css/style.css", "/static/js/i18n.js", "/static/js/app.js"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(SHELL).catch(function () {});
  }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.pathname.indexOf("/api/") === 0) {
    e.respondWith(fetch(e.request).catch(function () {
      return new Response(JSON.stringify({ error: "offline" }), { status: 503, headers: { "Content-Type": "application/json" } });
    }));
    return;
  }
  if (url.pathname.indexOf("/static/") === 0 || url.pathname === "/") {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(e.request, copy); });
        return res;
      }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match("/"); }); })
    );
  }
});
