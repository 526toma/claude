/* ============================================================
 * service-worker.js — 最低限のオフラインキャッシュ
 * ============================================================ */
const CACHE = 'hisho-cc-v1';
const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'css/style.css',
  'js/storage.js',
  'js/voice.js',
  'js/state.js',
  'js/api.js',
  'js/chat.js',
  'js/ride.js',
  'js/app.js',
  'images/hisho/normal.svg',
  'images/hisho/wink.svg',
  'images/hisho/cheer.svg',
  'images/hisho/worry.svg',
  'images/hisho/trouble.svg',
  'images/hisho/celebrate.svg',
  'images/hisho/surprise.svg',
  'images/hisho/relax.svg',
  'images/hisho/effort.svg',
  'images/hisho/tired.svg',
  'images/hisho/rest.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // /api はキャッシュしない（ネットワーク優先）
  if (url.pathname.startsWith('/api/')) return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => cached))
  );
});
