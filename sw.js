// Appli CSE installable : la page est toujours vérifiée sur GitHub quand le réseau répond
// (« no-cache » : si elle n'a pas changé, GitHub répond « inchangé » et rien n'est retéléchargé)
// (les mises à jour arrivent tout de suite) ; sans réseau, la dernière copie s'ouvre quand même.
// Les données (Gist GitHub, Google) ne passent jamais par ce cache.
const CACHE = 'cse-app-v4';   // V.11 : + outils Excel et PDF à part (lib-*.js), gardés pour le hors ligne
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'lib-xlsx.js', 'lib-pdf.js', 'lib-pdf-worker.js'].map(u => c.add(u).catch(() => {})))).catch(() => {}));
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
    fetch(r, { cache: 'no-cache' }).then(res => {
      if (res && res.ok) { const c = res.clone(); caches.open(CACHE).then(cc => cc.put(r, c)); }
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('./')))
  );
});
