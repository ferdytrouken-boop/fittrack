// Service worker: la app funciona sin conexión.
const VERSION = 'fittrack-v1.0.0';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/styles.css',
  './js/app.js', './js/db.js', './js/form.js', './js/ui.js', './js/charts.js',
  './js/icons.js', './js/catalog.js', './js/utils.js', './js/config.js',
  './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Nunca cachear la API de Supabase
  if (url.hostname.endsWith('supabase.co') || url.hostname.endsWith('supabase.in')) return;

  // Librerías y fuentes externas: caché primero
  if (url.origin !== location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
      return res;
    })));
    return;
  }
  // Ficheros propios: red primero (para recibir actualizaciones), caché si no hay conexión
  e.respondWith(fetch(req).then(res => {
    const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
