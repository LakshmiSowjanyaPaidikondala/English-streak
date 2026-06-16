const CACHE = 'english-streak-v2';
const FILES = [
  '/English-streak/',
  '/English-streak/index.html',
  '/English-streak/style.css',
  '/English-streak/app.js',
  '/English-streak/manifest.json',
  '/English-streak/icons/icon-192.png',
  '/English-streak/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
