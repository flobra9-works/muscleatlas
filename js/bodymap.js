/* MuscleAtlas — body map: rendered anatomy plates with pixel-exact region hits.
 *
 * The body is two rendered images (assets/body/{front,back}.webp) plus a matching
 * id map (…-id.png) whose red channel encodes the muscle region at every pixel
 * (index * BODY_ID_SCHRITT, see data/bodyregions.js).
 *
 * That single trick gives us both halves of the job:
 *   - clicking  -> read the id pixel under the pointer
 *   - colouring -> repaint the region's pixels onto an overlay canvas
 * so the click targets and the heatmap line up with the artwork exactly, with no
 * hand-traced outlines to drift out of sync.
 *
 * Artwork: Z-Anatomy (CC BY-SA 4.0), derived from BodyParts3D (CC BY-SA 2.1 JP).
 */

const BodyMap = {

  DATEI: { vorne: 'front', hinten: 'back' },
  // Bump alongside the ?v= in index.html — without it browsers keep serving the
  // previous id map and clicks land on last build's regions.
  V: '?v=14',
  BREITE: 1029, HOEHE: 2700,            // plate aspect ratio

  ansicht: 'vorne',
  _karten: {},        // ansicht -> { w, h, pixel: Uint8, regionen: {id: Uint32Array} }
  _laden: {},         // ansicht -> Promise
  _sichtbar: {},      // ansicht -> Set of region ids present in that view
  _zoom: 1, _ox: 0, _oy: 0,

  /* ---------- id map loading ---------- */

  ladeKarte(ansicht) {
    if (this._karten[ansicht]) return Promise.resolve(this._karten[ansicht]);
    if (this._laden[ansicht]) return this._laden[ansicht];

    this._laden[ansicht] = new Promise((fertig, fehler) => {
      const bild = new Image();
      bild.onload = () => {
        const c = document.createElement('canvas');
        c.width = bild.naturalWidth; c.height = bild.naturalHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(bild, 0, 0);
        const roh = ctx.getImageData(0, 0, c.width, c.height).data;

        // Bucket every body pixel by region once, so later repaints only touch
        // the pixels they need instead of scanning the whole image.
        const eimer = {};
        const sichtbar = new Set();
        for (let p = 0, i = 0; i < roh.length; i += 4, p++) {
          if (roh[i + 3] < 128) continue;
          const idx = Math.round(roh[i] / BODY_ID_SCHRITT);
          if (idx < 1 || idx > BODY_REGIONEN.length) continue;
          const rid = BODY_REGIONEN[idx - 1];
          (eimer[rid] || (eimer[rid] = [])).push(p);
          sichtbar.add(rid);
        }
        const regionen = {};
        Object.keys(eimer).forEach(r => { regionen[r] = Uint32Array.from(eimer[r]); });

        this._sichtbar[ansicht] = sichtbar;
        this._karten[ansicht] = { w: c.width, h: c.height, roh, regionen };
        fertig(this._karten[ansicht]);
      };
      bild.onerror = () => fehler(new Error('id map missing: ' + ansicht));
      bild.src = 'assets/body/' + this.DATEI[ansicht] + '-id.png' + this.V;
    });
    return this._laden[ansicht];
  },

  /* Which view shows a region best — so picking the lats flips to the back.
     Comparing "is it visible at all" is not enough: latissimus still has a
     ~4 700 px sliver at the edge of the front view. Only a clear majority of the
     region's pixels counts, otherwise muscles genuinely visible from both sides
     (calves, forearms) would flip the view for no reason. */
  UEBERGEWICHT: 3,

  ansichtFuer(regionId) {
    const zaehle = a => {
      const k = this._karten[a];
      const l = k && k.regionen[regionId];
      return l ? l.length : 0;
    };
    const v = zaehle('vorne'), h = zaehle('hinten');
    if (!v && !h) return null;
    if (h > v * this.UEBERGEWICHT) return 'hinten';
    if (v > h * this.UEBERGEWICHT) return 'vorne';
    return null;
  },

  regionAn(ansicht, u, v) {
    const k = this._karten[ansicht];
    if (!k) return null;
    const x = Math.floor(u * k.w), y = Math.floor(v * k.h);
    if (x < 0 || y < 0 || x >= k.w || y >= k.h) return null;
    const i = (y * k.w + x) * 4;
    if (k.roh[i + 3] < 128) return null;
    const idx = Math.round(k.roh[i] / BODY_ID_SCHRITT);
    if (idx < 1 || idx > BODY_REGIONEN.length) return null;
    return BODY_REGIONEN[idx - 1];
  },

  /* ---------- painting ---------- */

  /* Intensity 0–100 -> colour (yellow → orange → red), unchanged from v2. */
  heatFarbe(intensitaet) {
    const t = Math.max(0, Math.min(100, intensitaet)) / 100;
    if (t <= 0.02) return '';
    const hue = 52 - 52 * t;
    const satt = 78 + 14 * t;
    const hell = 58 - 12 * t;
    return `hsl(${Math.round(hue)}, ${Math.round(satt)}%, ${Math.round(hell)}%)`;
  },

  _rgb(farbe) {
    const m = /^hsl\((\d+), *(\d+)%, *(\d+)%\)$/.exec(farbe);
    if (!m) return [255, 107, 44];
    const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
    const f = n => {
      const k = (n + h * 12) % 12;
      const a = s * Math.min(l, 1 - l);
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
    };
    return [f(0), f(8), f(4)];
  },

  /* Paints { regionId: 0–100 } onto a plate's overlay canvas. */
  faerbe(canvas, ansicht, map, deckkraft) {
    const k = this._karten[ansicht];
    if (!k || !canvas) return;
    if (canvas.width !== k.w) { canvas.width = k.w; canvas.height = k.h; }
    const ctx = canvas.getContext('2d');
    const bild = ctx.createImageData(k.w, k.h);
    const px = bild.data;
    const alpha = Math.round(255 * (deckkraft == null ? 0.85 : deckkraft));

    Object.keys(map || {}).forEach(rid => {
      const wert = map[rid];
      const liste = k.regionen[rid];
      if (!liste || !wert) return;
      const [r, g, b] = this._rgb(this.heatFarbe(wert));
      const a = Math.round(alpha * Math.min(1, 0.35 + wert / 140));
      for (let n = 0; n < liste.length; n++) {
        const i = liste[n] * 4;
        px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
      }
    });
    ctx.putImageData(bild, 0, 0);
  },

  /* ---------- main body map (Muscles tab) ---------- */

  plateHtml(ansicht, klasse) {
    return `<div class="koerper-plate ${klasse || ''}" data-ansicht="${ansicht}">` +
      `<img class="plate-art" src="assets/body/${this.DATEI[ansicht]}.webp${this.V}" ` +
      `alt="Anatomical ${ansicht === 'vorne' ? 'front' : 'back'} view" draggable="false">` +
      `<canvas class="plate-tint"></canvas>` +
      `<svg class="plate-marker" viewBox="0 0 ${this.BREITE} ${this.HOEHE}"></svg>` +
      `</div>`;
  },

  render() {
    const wrap = document.getElementById('koerperkarte');
    if (!wrap) return;

    wrap.innerHTML =
      `<div class="plate-kopf">` +
      `<div class="segmente klein" id="ansichtSegmente">` +
      `<button data-ansicht="vorne" class="${this.ansicht === 'vorne' ? 'aktiv' : ''}">Front</button>` +
      `<button data-ansicht="hinten" class="${this.ansicht === 'hinten' ? 'aktiv' : ''}">Back</button>` +
      `</div>` +
      `<div class="plate-zoom">` +
      `<button data-z="-" aria-label="Zoom out">−</button>` +
      `<button data-z="0" aria-label="Reset view">⤢</button>` +
      `<button data-z="+" aria-label="Zoom in">+</button>` +
      `</div></div>` +
      `<div class="plate-buehne">${this.plateHtml(this.ansicht)}</div>` +
      `<div class="plate-hinweis versteckt" id="plateHinweis"></div>`;

    const buehne = wrap.querySelector('.plate-buehne');
    const plate = wrap.querySelector('.koerper-plate');

    wrap.querySelectorAll('#ansichtSegmente button').forEach(b =>
      b.addEventListener('click', () => this.zeigeAnsicht(b.getAttribute('data-ansicht'))));
    wrap.querySelectorAll('.plate-zoom button').forEach(b =>
      b.addEventListener('click', () => {
        const z = b.getAttribute('data-z');
        if (z === '+') this._zoom = Math.min(3, this._zoom * 1.3);
        else if (z === '-') this._zoom = Math.max(1, this._zoom / 1.3);
        else { this._zoom = 1; this._ox = 0; this._oy = 0; }
        this._anwenden(plate);
      }));

    this._bindeZeiger(buehne, plate);
    this._anwenden(plate);

    Promise.all([this.ladeKarte('vorne'), this.ladeKarte('hinten')])
      .then(() => { this.markiereAuswahl(); this.zeichneHotspots(); })
      .catch(() => {
        buehne.innerHTML = `<div class="leer-hinweis">Body artwork could not be loaded.</div>`;
      });
  },

  zeigeAnsicht(ansicht) {
    if (ansicht === this.ansicht) return;
    this.ansicht = ansicht;
    this._zoom = 1; this._ox = 0; this._oy = 0;
    this.render();
  },

  _anwenden(plate) {
    if (!plate) return;
    plate.style.transform =
      `translate(${this._ox}px, ${this._oy}px) scale(${this._zoom})`;
  },

  /* Pointer handling: a drag pans, a tap selects. */
  _bindeZeiger(buehne, plate) {
    let unten = false, gezogen = false, sx = 0, sy = 0, ax = 0, ay = 0;

    buehne.addEventListener('pointerdown', ev => {
      if (ev.target.closest('button')) return;
      unten = true; gezogen = false;
      sx = ev.clientX; sy = ev.clientY; ax = this._ox; ay = this._oy;
      buehne.setPointerCapture(ev.pointerId);
    });

    buehne.addEventListener('pointermove', ev => {
      if (!unten) return;
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!gezogen && Math.hypot(dx, dy) > 6) gezogen = true;
      if (gezogen && this._zoom > 1) {
        this._ox = ax + dx; this._oy = ay + dy;
        this._anwenden(plate);
      }
    });

    buehne.addEventListener('pointerup', ev => {
      if (!unten) return;
      unten = false;
      if (gezogen) return;                       // a pan, not a tap
      const bild = plate.querySelector('.plate-art');
      const r = bild.getBoundingClientRect();
      const region = this.regionAn(this.ansicht,
        (ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height);
      if (region) Uebungen.waehleRegion(region);
    });

    buehne.addEventListener('wheel', ev => {
      ev.preventDefault();
      this._zoom = Math.max(1, Math.min(3, this._zoom * (ev.deltaY < 0 ? 1.12 : 1 / 1.12)));
      if (this._zoom === 1) { this._ox = 0; this._oy = 0; }
      this._anwenden(plate);
    }, { passive: false });
  },

  markiereAuswahl() {
    const wrap = document.getElementById('koerperkarte');
    if (!wrap) return;
    const canvas = wrap.querySelector('.plate-tint');
    const aktiv = Uebungen.aktiveRegionen || [];

    // A region only shown on the other side: flip the view rather than leave the
    // user staring at a body with nothing highlighted.
    if (aktiv.length === 1) {
      const besser = this.ansichtFuer(aktiv[0]);
      if (besser && besser !== this.ansicht && this._karten[besser]) {
        this.ansicht = besser;
        this.render();
        return;
      }
    }

    const map = {};
    aktiv.forEach(r => { map[r] = 100; });
    this.faerbe(canvas, this.ansicht, map, 0.78);
  },

  /* ---------- Ring markers: muscles you are neglecting ----------
     Badge = days since that muscle was last worked; "–" means never.
     Tapping a ring jumps straight to exercises for it. */

  MIN_SESSIONS: 3,      // below this there is no pattern worth judging
  STALE_TAGE: 10,       // untouched this long counts as neglected
  NIE_AB_TAGEN: 14,     // "never trained" only means something once history is this old
  MAX_MARKER: 6,        // a body covered in rings nags instead of informing

  vernachlaessigt() {
    if (typeof Speicher === 'undefined' || !Speicher.daten) return [];
    const sessions = Speicher.daten.verlauf || [];
    // A new user has trained nothing, which would light up all 20 muscles at
    // once. Say nothing until there is enough history to be worth a comment.
    if (sessions.length < this.MIN_SESSIONS) return [];

    // Secondary involvement counts as worked. Forearms and core are almost
    // nobody's primary target, but rows and squats hammer them — flagging those
    // every week would be noise, not a useful signal.
    const zuletzt = {};
    let aeltester = Infinity;
    sessions.forEach(s => {
      aeltester = Math.min(aeltester, s.start);
      (s.saetze || []).forEach(x => {
        const u = uebungVonId(x.uebungId);
        if (!u) return;
        u.primaer.concat(u.sekundaer).forEach(r => {
          if (!zuletzt[r] || s.start > zuletzt[r]) zuletzt[r] = s.start;
        });
      });
    });

    const jetzt = Date.now();
    const spanneTage = (jetzt - aeltester) / 864e5;

    // A muscle never trained counts as stale for as long as the log has existed.
    // Putting "never" and "not since March" on the same scale is what makes the
    // ranking honest: "never" in a two-week-old log is weaker evidence than a
    // genuine 30-day gap, and ranking all the "nevers" first would have buried
    // the real gaps below the cap.
    const treffer = [];
    BODY_REGIONEN.forEach(rid => {
      const nie = !zuletzt[rid];
      if (nie && spanneTage < this.NIE_AB_TAGEN) return;
      const tage = nie ? Math.floor(spanneTage)
                       : Math.floor((jetzt - zuletzt[rid]) / 864e5);
      if (tage >= this.STALE_TAGE) treffer.push({ rid, tage, nie });
    });

    treffer.sort((a, b) => b.tage - a.tage);
    return treffer.slice(0, this.MAX_MARKER);
  },

  /* Where to put a region's marker, in plate viewBox coordinates.

     Two traps here, both of which put rings in the wrong place:
     - Almost every muscle is a symmetric left/right pair, so the centroid of
       all its pixels lands on the midline. Averaging naively stacks every
       marker in a column down the sternum. Use one side of the body only.
     - The centroid of a curved or hollow region can fall outside the region
       itself, so snap to the nearest pixel that really belongs to it. */
  _mittelpunkt(ansicht, regionId) {
    const k = this._karten[ansicht];
    const liste = k && k.regionen[regionId];
    if (!liste || !liste.length) return null;

    const halbe = k.w / 2;
    const schritt = Math.max(1, Math.floor(liste.length / 800));

    let nurLinks = true;
    let sx = 0, sy = 0, n = 0;
    for (let i = 0; i < liste.length; i += schritt) {
      const x = liste[i] % k.w;
      if (x > halbe) continue;                 // one side only
      sx += x; sy += Math.floor(liste[i] / k.w); n++;
    }
    if (!n) {                                  // region sits entirely on the other side
      nurLinks = false;
      for (let i = 0; i < liste.length; i += schritt) {
        sx += liste[i] % k.w; sy += Math.floor(liste[i] / k.w); n++;
      }
    }
    const cx = sx / n, cy = sy / n;

    let bx = cx, by = cy, best = Infinity;
    for (let i = 0; i < liste.length; i += schritt) {
      const x = liste[i] % k.w, y = Math.floor(liste[i] / k.w);
      if (nurLinks && x > halbe) continue;
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d < best) { best = d; bx = x; by = y; }
    }
    return { x: bx * (this.BREITE / k.w), y: by * (this.HOEHE / k.h) };
  },

  zeichneHotspots() {
    const wrap = document.getElementById('koerperkarte');
    const svg = wrap && wrap.querySelector('.plate-marker');
    if (!svg) return;
    const liste = this.vernachlaessigt();

    const punkte = liste.map(m => {
      const p = this._mittelpunkt(this.ansicht, m.rid);
      return p ? Object.assign({ x: p.x, y: p.y }, m) : null;
    }).filter(Boolean);                        // dropped = not on this side of the body
    const sichtbar = punkte.length;

    // Neglected muscles cluster (upper chest, front delt and biceps all sit
    // within a hand's width), so the rings collide. Nudge overlapping pairs
    // apart. The ring carries its region in data-region, so moving it a little
    // off the exact muscle costs nothing — it is a labelled button, not a
    // hit-test target.
    const MIN_ABSTAND = 112;
    for (let runde = 0; runde < 12; runde++) {
      let bewegt = false;
      for (let i = 0; i < punkte.length; i++) {
        for (let j = i + 1; j < punkte.length; j++) {
          const a = punkte[i], b = punkte[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          let d = Math.hypot(dx, dy);
          if (d >= MIN_ABSTAND) continue;
          if (d < 1) { dx = 1; dy = 0; d = 1; }
          const schub = (MIN_ABSTAND - d) / 2;
          a.x -= dx / d * schub; a.y -= dy / d * schub;
          b.x += dx / d * schub; b.y += dy / d * schub;
          bewegt = true;
        }
      }
      if (!bewegt) break;
    }

    svg.innerHTML = punkte.map(({ rid, tage, nie, x, y }) => {
      const text = tage > 99 ? '99' : String(tage);
      const titel = nie
        ? `${regionKurz(rid)} — never trained in your ${tage}-day history`
        : `${regionKurz(rid)} — last trained ${tage} days ago`;
      return `<g class="plate-hotspot" data-region="${rid}">` +
        `<title>${titel}</title>` +
        `<circle class="ring" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="34"/>` +
        `<circle class="badge" cx="${(x + 28).toFixed(0)}" cy="${(y - 28).toFixed(0)}" r="21"/>` +
        `<text class="badge-text" x="${(x + 28).toFixed(0)}" y="${(y - 20).toFixed(0)}">${text}</text>` +
        `</g>`;
    }).join('');
    svg.querySelectorAll('.plate-hotspot').forEach(g =>
      g.addEventListener('click', ev => {
        ev.stopPropagation();
        Uebungen.waehleRegion(g.getAttribute('data-region'));
      }));

    // Rings are meaningless without a word of explanation.
    const hinweis = wrap.querySelector('#plateHinweis');
    if (hinweis) {
      const andere = liste.length - sichtbar;
      hinweis.innerHTML = sichtbar
        ? `⚠ Not trained recently — the number is days since. ` +
          (andere ? `<span class="hinweis-klein">${andere} more on the ` +
                    `${this.ansicht === 'vorne' ? 'back' : 'front'}.</span>` : '')
        : (liste.length
            ? `⚠ ${liste.length} neglected muscle${liste.length > 1 ? 's' : ''} on the ` +
              `${this.ansicht === 'vorne' ? 'back' : 'front'} view.`
            : '');
      hinweis.classList.toggle('versteckt', !liste.length);
    }
  },

  /* ---------- mini bodies (exercise detail heatmap) ---------- */

  miniKoerper(id) {
    return `<div class="heat-koerper"${id ? ` id="${id}"` : ''}>` +
      this.plateHtml('vorne', 'mini') +
      this.plateHtml('hinten', 'mini') +
      `</div>`;
  },

  /* Colours every .koerper-plate under wurzelEl from map { regionId: 0–100 }. */
  heatmap(wurzelEl, map) {
    if (!wurzelEl) return;
    wurzelEl.querySelectorAll('.koerper-plate').forEach(plate => {
      const ansicht = plate.getAttribute('data-ansicht');
      const canvas = plate.querySelector('.plate-tint');
      this.ladeKarte(ansicht)
        .then(() => this.faerbe(canvas, ansicht, map, 0.9))
        .catch(() => {});
    });
  }
};
