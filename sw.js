/* MuscleAtlas — service worker (offline app shell) */

const CACHE = 'muscleatlas-v14';
/* Must match the ?v= versions in index.html */
const DATEIEN = [
  './',
  './index.html',
  './css/style.css?v=14',
  './data/muscles.js?v=14',
  './data/bodyregions.js?v=14',
  './data/exercises.js?v=14',
  './js/state.js?v=14',
  './js/heartrate.js?v=14',
  './js/bodymap.js?v=14',
  './js/exercises.js?v=14',
  './js/workouts.js?v=14',
  './js/training.js?v=14',
  './js/history.js?v=14',
  './js/app.js?v=14',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/body/front.webp?v=14',
  './assets/body/back.webp?v=14',
  './assets/body/front-id.png?v=14',
  './assets/body/back-id.png?v=14'
];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  const url = new URL(ev.request.url);
  // External requests (Spotify etc.) always go straight to the network
  if (url.origin !== location.origin) return;
  ev.respondWith(
    caches.match(ev.request).then(treffer =>
      treffer || fetch(ev.request).then(antwort => {
        const kopie = antwort.clone();
        caches.open(CACHE).then(c => c.put(ev.request, kopie));
        return antwort;
      })
    ).catch(() => caches.match('./index.html'))
  );
});
