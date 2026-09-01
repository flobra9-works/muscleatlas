/* Cache-version tool for MuscleAtlas.
 *
 *   node scripts/version.js            # check only  (also runs in CI)
 *   node scripts/version.js bump       # bump to the next version
 *   node scripts/version.js set 20     # set an explicit version
 *
 * The app's cache busting lives in THREE places that must agree:
 *   index.html    ?v=N on every css/js reference
 *   sw.js         ?v=N on every cached file, plus the CACHE name
 *   js/bodymap.js V: '?v=N' for the body plates and id maps
 *
 * Getting them out of sync fails silently: the browser keeps serving the
 * previous file, so the app looks fine but runs stale code — and for the id map
 * it means clicks land on the previous build's muscle regions. That cost real
 * debugging time, hence this script.
 *
 * It also checks two things that break offline mode just as quietly:
 *   - a css/js file loaded by index.html but missing from the service worker
 *     list (never cached, so the app breaks offline)
 *   - a file listed in the service worker that no longer exists (addAll rejects
 *     on a single 404, so the ENTIRE cache install fails and nothing is cached)
 */

const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..');
const P = n => path.join(WURZEL, n);
const lies = n => fs.readFileSync(P(n), 'utf8');

const HTML = 'index.html';
const SW = 'sw.js';
const BODYMAP = 'js/bodymap.js';

/* ---------------------------------------------------------------- reading */

function versionen() {
  const html = lies(HTML), sw = lies(SW), bm = lies(BODYMAP);

  const alle = s => [...s.matchAll(/\?v=(\d+)/g)].map(m => +m[1]);
  const einzig = (liste, wo) => {
    const s = [...new Set(liste)];
    if (!s.length) throw new Error(`no ?v= version found in ${wo}`);
    if (s.length > 1) throw new Error(`${wo} mixes versions: ${s.join(', ')}`);
    return s[0];
  };

  const cacheName = /muscleatlas-v(\d+)/.exec(sw);
  if (!cacheName) throw new Error('no CACHE name found in sw.js');

  const bmV = /V:\s*'\?v=(\d+)'/.exec(bm);
  if (!bmV) throw new Error("no \"V: '?v=N'\" found in js/bodymap.js");

  return {
    html: einzig(alle(html), HTML),
    sw: einzig(alle(sw), SW),
    swCache: +cacheName[1],
    bodymap: +bmV[1]
  };
}

/* ------------------------------------------------------- consistency check */

// './css/style.css?v=14' -> 'css/style.css'
const blank = p => p.replace(/^\.\//, '').replace(/\?v=\d+$/, '');

function pruefe() {
  const probleme = [];
  const v = versionen();

  const werte = [v.html, v.sw, v.swCache, v.bodymap];
  if (new Set(werte).size !== 1) {
    probleme.push(`version mismatch — index.html=${v.html} sw.js=${v.sw} ` +
      `sw CACHE=${v.swCache} bodymap=${v.bodymap}`);
  }

  const html = lies(HTML), sw = lies(SW);

  const swListe = [...sw.matchAll(/'(\.\/[^']*)'/g)].map(m => m[1]);
  const swBlank = new Set(swListe.map(blank));

  // Everything index.html loads must be cached, or the app breaks offline.
  const geladen = [...html.matchAll(/(?:src|href)="([^":]+\.(?:js|css))(?:\?v=\d+)?"/g)]
    .map(m => m[1]);
  geladen.forEach(f => {
    if (!swBlank.has(blank(f))) probleme.push(`${f} is loaded by index.html but not cached in sw.js`);
  });

  // A single missing file makes cache.addAll reject and nothing gets cached.
  swListe.forEach(p => {
    const rel = blank(p);
    if (!rel || rel.endsWith('/')) return;
    if (!fs.existsSync(P(rel))) probleme.push(`sw.js caches ${rel}, which does not exist`);
  });

  // The Android build copies a fixed folder list into www/. Anything the app
  // caches but build-www.js does not copy is simply absent from the APK — the
  // web version works, the installed app is broken, and nothing warns you.
  // (This shipped once: the body plates live in assets/, which was not copied.)
  const bww = lies('scripts/build-www.js');
  const kopiert = new Set([
    ...(/const DATEIEN = \[([^\]]*)\]/.exec(bww)?.[1] || '').match(/'([^']+)'/g) || [],
    ...(/const ORDNER = \[([^\]]*)\]/.exec(bww)?.[1] || '').match(/'([^']+)'/g) || []
  ].map(s => s.replace(/'/g, '')));

  [...new Set(swListe.map(blank).filter(Boolean))].forEach(rel => {
    if (rel.endsWith('/')) return;
    const oben = rel.split('/')[0];
    if (!kopiert.has(oben) && !kopiert.has(rel)) {
      probleme.push(`sw.js caches ${rel}, but scripts/build-www.js does not copy ` +
        `"${oben}" into www/ — it would be missing from the APK`);
    }
  });

  return { version: v.html, probleme };
}

/* ------------------------------------------------------------------ writing */

function schreibe(neu) {
  const alt = versionen().html;
  [HTML, SW, BODYMAP].forEach(datei => {
    const vorher = lies(datei);
    const nachher = vorher
      .replace(/\?v=\d+/g, `?v=${neu}`)
      .replace(/muscleatlas-v\d+/g, `muscleatlas-v${neu}`);
    if (nachher !== vorher) fs.writeFileSync(P(datei), nachher);
  });
  return { alt, neu };
}

/* --------------------------------------------------------------------- cli */

const befehl = process.argv[2] || 'check';

try {
  if (befehl === 'check') {
    const { version, probleme } = pruefe();
    if (probleme.length) {
      console.error('Version check FAILED:');
      probleme.forEach(p => console.error('  - ' + p));
      process.exit(1);
    }
    console.log(`Version check OK — everything on v=${version}.`);
  } else if (befehl === 'bump' || befehl === 'set') {
    const neu = befehl === 'set' ? parseInt(process.argv[3], 10)
                                 : versionen().html + 1;
    if (!Number.isInteger(neu) || neu < 1) throw new Error('usage: version.js set <number>');
    const { alt } = schreibe(neu);
    const { probleme } = pruefe();
    probleme.forEach(p => console.warn('  ! ' + p));
    console.log(`Bumped v=${alt} -> v=${neu} in index.html, sw.js and js/bodymap.js.`);
    if (probleme.length) process.exit(1);
  } else {
    console.error('usage: node scripts/version.js [check|bump|set <number>]');
    process.exit(1);
  }
} catch (e) {
  console.error('Version tool failed: ' + e.message);
  process.exit(1);
}
