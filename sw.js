// Appli CSE installable : la page est toujours prise sur GitHub quand le réseau répond
// (les mises à jour arrivent tout de suite) ; sans réseau, la dernière copie s'ouvre quand même.
// Les données (Gist GitHub, Google) ne passent jamais par ce cache.
const CACHE = 'cse-app-v1';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'])).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  e.respondWith(
    fetch(r, { cache: 'no-store' }).then(res => {
      if (res && res.ok) { const c = res.clone(); caches.open(CACHE).then(cc => cc.put(r, c)); }
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('./')))
  );
});
