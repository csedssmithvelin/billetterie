// Espace salarié du CSE : copie hors ligne de la page + notifications sur le téléphone (Firebase).
// 11.4 : ouverture immédiate avec la copie gardée, mise à jour vérifiée en arrière-plan.
// La configuration Firebase (publique) arrive dans l'adresse de ce fichier (?cfg=…), donnée par la page.
const CACHE = 'cse-espace-v2';
try {
  const cfg = JSON.parse(new URL(self.location.href).searchParams.get('cfg') || 'null');
  if (cfg && cfg.apiKey && cfg.messagingSenderId) {
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
    firebase.initializeApp(cfg);
    firebase.messaging();
  }
} catch (e) { }
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['espace-salarie.html', 'espace-manifest.webmanifest', 'icon-192.png', 'icon-espace-192.png'])).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf('cse-espace-') === 0 && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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
  const secours = () => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('espace-salarie.html'));
  // Vérification de nouvelle version (ou rechargement forcé) : toujours GitHub d'abord.
  if (r.cache === 'no-cache' || r.cache === 'reload' || r.cache === 'no-store') { e.respondWith(reseau().catch(secours)); return; }
  // Ouverture : la copie gardée s'affiche tout de suite, GitHub est vérifié en arrière-plan.
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => {
    if (m) { e.waitUntil(reseau().catch(() => {})); return m; }
    return reseau().catch(secours);
  }));
});
// Clic sur une notification sans lien : ouvre (ou remet devant) l'espace salarié.
self.addEventListener('notificationclick', e => {
  const url = (e.notification && e.notification.data && (e.notification.data.url || (e.notification.data.FCM_MSG && e.notification.data.FCM_MSG.data && e.notification.data.FCM_MSG.data.url))) || 'espace-salarie.html';
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(L => {
    for (const c of L) { if (c.url.indexOf('espace-salarie.html') >= 0 && 'focus' in c) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
