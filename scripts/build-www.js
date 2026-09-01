/* Assembles the web app into www/ for Capacitor.
   There is no build step — this just copies the static files that make up the app.

   sw.js is deliberately left out: inside the native WebView the service worker
   adds nothing (the files are already local) but its cache-first strategy would
   pin users to a stale version after an app update. app.js already ignores a
   failed registration. */

const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..');
const ZIEL = path.join(WURZEL, 'www');

const DATEIEN = ['index.html', 'manifest.json'];
// Keep in step with the service-worker cache list — scripts/version.js checks
// that these cover everything sw.js caches. 'assets' holds the body plates and
// id maps; leaving it out ships an APK whose body map cannot load.
const ORDNER = ['css', 'data', 'js', 'icons', 'assets'];

function leere(ordner) {
  if (fs.existsSync(ordner)) fs.rmSync(ordner, { recursive: true, force: true });
  fs.mkdirSync(ordner, { recursive: true });
}

function kopiereOrdner(von, nach) {
  fs.mkdirSync(nach, { recursive: true });
  for (const eintrag of fs.readdirSync(von, { withFileTypes: true })) {
    const q = path.join(von, eintrag.name);
    const z = path.join(nach, eintrag.name);
    if (eintrag.isDirectory()) kopiereOrdner(q, z);
    else fs.copyFileSync(q, z);
  }
}

leere(ZIEL);

let anzahl = 0;
for (const datei of DATEIEN) {
  fs.copyFileSync(path.join(WURZEL, datei), path.join(ZIEL, datei));
  anzahl++;
}
for (const ordner of ORDNER) {
  const von = path.join(WURZEL, ordner);
  if (!fs.existsSync(von)) continue;
  kopiereOrdner(von, path.join(ZIEL, ordner));
  anzahl += fs.readdirSync(von).length;
}

console.log(`www/ built — ${anzahl} entries copied (service worker intentionally omitted).`);
