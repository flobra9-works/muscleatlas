/* MuscleAtlas — service worker (offline app shell) */

const CACHE = 'muscleatlas-v5';
/* Must match the ?v= versions in index.html */
const DATEIEN = [
  './',
  './index.html',
  './css/style.css?v=5',
  './data/muscles.js?v=5',
  './data/bodysvg.js?v=5',
  './data/exercises.js?v=5',
  './js/state.js?v=5',
  './js/heartrate.js?v=5',
  './js/bodymap.js?v=5',
  './js/exercises.js?v=5',
  './js/workouts.js?v=5',
  './js/training.js?v=5',
  './js/app.js?v=5',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
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
