/* 위페어 현황판 서비스워커 — 앱 셸 캐시(네트워크 우선, 오프라인 대비)
   · 배포를 자주 하므로 '네트워크 우선'으로 항상 최신본을 보이고, 실패 시 캐시로 대체
   · Supabase·CDN 등 외부(cross-origin) 요청은 건드리지 않고 그대로 네트워크로 통과 */
const CACHE = 'wepair-shell-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // 외부 요청은 통과(캐시 안 함)
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match('./index.html'); });
    })
  );
});
