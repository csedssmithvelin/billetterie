// Appli CSE installable. V.11.2 : ouverture immédiate avec la copie gardée sur l'appareil, GitHub est vérifié
// en arrière-plan ; une nouvelle version est annoncée par l'appli (« Nouvelle version, mettre à jour ? »).
// Sans réseau, la dernière copie s'ouvre quand même.
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
  const reseau = () => fetch(r, { cache: 'no-cache' }).then(res => {
    if (res && res.ok) { const c = res.clone(); caches.open(CACHE).then(cc => cc.put(r, c)); }
    return res;
  });
  const secours = () => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('./'));
  // Vérification de nouvelle version (ou rechargement forcé) : toujours GitHub d'abord.
  if (r.cache === 'no-cache' || r.cache === 'reload' || r.cache === 'no-store') { e.respondWith(reseau().catch(secours)); return; }
  // Ouverture : la copie gardée s'affiche tout de suite, GitHub est vérifié en arrière-plan.
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => {
    if (m) { e.waitUntil(reseau().catch(() => {})); return m; }
    return reseau().catch(secours);
  }));
});
