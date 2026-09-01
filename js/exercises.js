/* MuscleAtlas — exercise browser: selection, filters, detail view with
   the interactive activation model */

const Uebungen = {
  modus: 'karte',            // 'karte' | 'liste'
  aktiveGruppe: null,        // group ID
  aktiveRegionen: [],        // active region IDs (sub-selection)
  regionFokus: null,         // single region or null = whole group
  filterEquip: 'alle',       // 'alle' | 'frei' | 'gefuehrt'
  filterArt: 'alle',         // 'alle' | 'komplex' | 'isoliert'
  varAuswahl: {},            // parameter choice in the detail view
  detailUebung: null,

  init() {
    // Body map / list switch
    document.querySelectorAll('#auswahlmodusSegmente button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.modus = btn.getAttribute('data-modus');
        document.querySelectorAll('#auswahlmodusSegmente button').forEach(b => b.classList.toggle('aktiv', b === btn));
        document.getElementById('koerperkarte').classList.toggle('versteckt', this.modus !== 'karte');
        document.getElementById('gruppenListe').classList.toggle('versteckt', this.modus !== 'liste');
        document.getElementById('kartenHinweis').textContent =
          this.modus === 'karte' ? 'Tap a muscle group' : 'Pick a muscle group';
      });
    });
    this.renderGruppenListe();
  },

  renderGruppenListe() {
    const wrap = document.getElementById('gruppenListe');
    wrap.innerHTML = MUSKEL_GRUPPEN.map(g => {
      const anzahl = uebungenFuerRegionen(g.regionen).direkt.length;
      return `<button data-gruppe="${g.id}" class="${this.aktiveGruppe === g.id ? 'aktiv' : ''}">` +
        `${g.name}<small>${g.en} · ${anzahl} exercises</small></button>`;
    }).join('');
    wrap.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => this.waehleGruppe(btn.getAttribute('data-gruppe'), null));
    });
  },

  /* Click on an SVG region */
  waehleRegion(regionId) {
    const gruppe = gruppeZuRegion(regionId);
    if (!gruppe) return;
    this.waehleGruppe(gruppe.id, gruppe.regionen.length > 1 ? regionId : null);
  },

  waehleGruppe(gruppeId, regionFokus) {
    const gruppe = MUSKEL_GRUPPEN.find(g => g.id === gruppeId);
    if (!gruppe) return;
    this.aktiveGruppe = gruppeId;
    this.regionFokus = regionFokus || null;
    this.aktiveRegionen = regionFokus ? [regionFokus] : gruppe.regionen.slice();
    this.renderGruppenListe();
    BodyMap.markiereAuswahl();
    this.renderAuswahl();
    const bereich = document.getElementById('auswahlBereich');
    bereich.classList.remove('versteckt');
    setTimeout(() => bereich.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  },

  renderAuswahl() {
    const gruppe = MUSKEL_GRUPPEN.find(g => g.id === this.aktiveGruppe);
    if (!gruppe) return;
    document.getElementById('auswahlTitel').textContent = `Exercises for: ${gruppe.name} (${gruppe.en})`;

    // Region chips (only if the group has several regions)
    const regionChips = document.getElementById('regionChips');
    if (gruppe.regionen.length > 1) {
      regionChips.innerHTML =
        `<button class="chip klein ${!this.regionFokus ? 'aktiv' : ''}" data-region="">All areas</button>` +
        gruppe.regionen.map(r =>
          `<button class="chip klein ${this.regionFokus === r ? 'aktiv' : ''}" data-region="${r}">${regionKurz(r)}</button>`
        ).join('');
      regionChips.classList.add('chip-strip');
      regionChips.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          this.waehleGruppe(gruppe.id, btn.getAttribute('data-region') || null);
        });
      });
    } else {
      regionChips.innerHTML = '';
    }

    // Filter chips
    const filter = document.getElementById('filterChips');
    filter.className = 'filter-bereich';
    const chip = (f, wert, aktiv, label) =>
      `<button class="chip klein ${aktiv === wert ? 'aktiv' : ''}" data-f="${f}" data-w="${wert}">${label}</button>`;
    filter.innerHTML =
      `<div class="chip-strip">` +
      chip('equip', 'alle', this.filterEquip, 'All equipment') +
      chip('equip', 'frei', this.filterEquip, '🏋 Free weights') +
      chip('equip', 'gefuehrt', this.filterEquip, '⚙ Machine / cable') +
      `</div>` +
      `<div class="chip-strip">` +
      chip('art', 'alle', this.filterArt, 'All types') +
      chip('art', 'komplex', this.filterArt, 'Compound') +
      chip('art', 'isoliert', this.filterArt, 'Isolation') +
      `</div>`;
    filter.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.getAttribute('data-f') === 'equip') this.filterEquip = btn.getAttribute('data-w');
        else this.filterArt = btn.getAttribute('data-w');
        this.renderAuswahl();
      });
    });

    this.renderListe();
  },

  passtFilter(u) {
    if (this.filterEquip !== 'alle' && u.kategorie !== this.filterEquip) return false;
    if (this.filterArt === 'komplex' && !u.komplex) return false;
    if (this.filterArt === 'isoliert' && u.komplex) return false;
    return true;
  },

  renderListe() {
    const ziel = document.getElementById('uebungsListe');
    const { direkt, mitwirkend } = uebungenFuerRegionen(this.aktiveRegionen);
    const d = direkt.filter(u => this.passtFilter(u));
    const m = mitwirkend.filter(u => this.passtFilter(u));

    let html = '';
    if (!d.length && !m.length) {
      html = `<div class="leer-hinweis">No exercises match these filters.<br>Reset one of them.</div>`;
    } else {
      html += d.map(u => this.karteHtml(u)).join('');
      if (m.length) {
        html += `<div class="abschnitt-titel">Also involved (as secondary muscle)</div>`;
        html += m.map(u => this.karteHtml(u)).join('');
      }
    }
    ziel.innerHTML = html;

    ziel.querySelectorAll('.uebungs-karte').forEach(karte => {
      const id = karte.getAttribute('data-id');
      karte.addEventListener('click', () => this.zeigeDetail(id));
      const plus = karte.querySelector('.plus-btn');
      if (plus) plus.addEventListener('click', ev => { ev.stopPropagation(); Workouts.zeigeWorkoutWahl(id); });
    });
  },

  badgesHtml(u) {
    return `<div class="badge-zeile">` +
      (u.kategorie === 'frei'
        ? `<span class="badge frei">Free weights</span>`
        : `<span class="badge gefuehrt">Machine</span>`) +
      (u.geraet !== 'Machine' ? `<span class="badge">${u.geraet}</span>` : '') +
      (u.komplex ? `<span class="badge komplex">Compound</span>` : `<span class="badge isoliert">Isolation</span>`) +
      (u.variationen ? `<span class="badge interaktiv">⚡ Interactive</span>` : '') +
      `</div>`;
  },

  karteHtml(u) {
    return `<div class="uebungs-karte${u.variationen ? ' hat-variation' : ''}" data-id="${u.id}">` +
      `<div class="uebungs-kopf">` +
      `<div class="uebungs-name">${u.name}<small>${u.nameDe}</small></div>` +
      `<button class="plus-btn" title="Add to a workout">＋</button>` +
      `</div>` +
      this.badgesHtml(u) +
      `<div class="muskel-zeile"><b>${u.primaer.map(regionKurz).join(', ')}</b>` +
      (u.sekundaer.length ? ` · ${u.sekundaer.map(regionKurz).join(', ')}` : '') +
      `</div>` +
      `</div>`;
  },

  /* ---------- Detail view ---------- */

  zeigeDetail(uebungId) {
    const u = uebungVonId(uebungId);
    if (!u) return;
    this.detailUebung = u;
    this.varAuswahl = {};
    if (u.variationen) {
      u.variationen.parameter.forEach(p => { this.varAuswahl[p.id] = p.werte[0].id; });
    }

    let html = `<div class="overlay-griff"></div>` +
      `<div class="overlay-kopf">` +
      `<div><h2>${u.name}</h2><div class="hinweis-klein">${u.nameDe} · ${u.geraet}</div></div>` +
      `<button class="schliessen-btn" data-schliessen>✕</button>` +
      `</div>` +
      this.badgesHtml(u) +
      `<p style="margin:12px 0; font-size:.92rem;">${u.beschreibung}</p>` +
      `<div class="muskel-zeile">Primary: <b>${u.primaer.map(regionName).join(', ')}</b>` +
      (u.sekundaer.length ? `<br>Assisting: ${u.sekundaer.map(regionName).join(', ')}` : '') + `</div>`;

    if (u.variationen) {
      html += `<div class="variation-box">` +
        `<h3>⚡ Activation by execution</h3>` +
        `<div class="hinweis-klein">Adjust the execution and watch the focus shift live (estimates).</div>` +
        u.variationen.parameter.map(p =>
          `<div class="parameter-block" data-param="${p.id}">` +
          `<div class="param-name">${p.name}</div>` +
          `<div class="chip-zeile">` +
          p.werte.map((w, i) =>
            `<button class="chip klein ${i === 0 ? 'aktiv' : ''}" data-wert="${w.id}">${w.name}</button>`
          ).join('') +
          `</div></div>`
        ).join('') +
        `<div class="heat-bereich">` +
        BodyMap.miniKoerper('detailHeat') +
        `<div class="heat-balken" id="detailBalken"></div>` +
        `</div>` +
        `<div class="variation-erklaerung" id="detailErklaerung"></div>` +
        `</div>`;
    } else {
      html += `<div class="variation-box">` +
        `<h3>Target muscles</h3>` +
        `<div class="heat-bereich">` +
        BodyMap.miniKoerper('detailHeat') +
        `<div class="heat-balken" id="detailBalken"></div>` +
        `</div></div>`;
    }

    html += Historie.uebungFortschrittHtml(u.id);

    html += `<div class="btn-zeile">` +
      `<button class="btn primaer breit" id="detailPlus">＋ Add to workout</button>` +
      `</div>`;

    const wrap = document.getElementById('uebungDetailInhalt');
    wrap.innerHTML = html;
    App.zeigeOverlay('uebungDetail');

    wrap.querySelector('[data-schliessen]').addEventListener('click', () => App.schliesseOverlay('uebungDetail'));
    wrap.querySelector('#detailPlus').addEventListener('click', () => {
      App.schliesseOverlay('uebungDetail');
      Workouts.zeigeWorkoutWahl(u.id);
    });

    if (u.variationen) {
      wrap.querySelectorAll('.parameter-block').forEach(block => {
        const paramId = block.getAttribute('data-param');
        block.querySelectorAll('.chip').forEach(chip => {
          chip.addEventListener('click', () => {
            this.varAuswahl[paramId] = chip.getAttribute('data-wert');
            block.querySelectorAll('.chip').forEach(c => c.classList.toggle('aktiv', c === chip));
            this.aktualisiereVariation();
          });
        });
      });
      this.aktualisiereVariation();
    } else {
      // Static activation from primary/secondary muscles
      const map = {};
      u.primaer.forEach(r => { map[r] = 90; });
      u.sekundaer.forEach(r => { map[r] = 45; });
      this.zeichneHeat(map);
    }
  },

  aktualisiereVariation() {
    const u = this.detailUebung;
    if (!u || !u.variationen) return;
    const key = u.variationen.parameter.map(p => this.varAuswahl[p.id]).join('|');
    const map = u.variationen.beanspruchung[key] || {};
    this.zeichneHeat(map);
    const erklaerung = (u.variationen.erklaerung || {})[key] || '';
    const box = document.getElementById('detailErklaerung');
    if (box) { box.textContent = erklaerung; box.style.display = erklaerung ? '' : 'none'; }
  },

  zeichneHeat(map) {
    const heatWrap = document.getElementById('detailHeat');
    const balken = document.getElementById('detailBalken');
    if (!heatWrap || !balken) return;

    const regionen = {}, details = {};
    Object.keys(map).forEach(k => {
      if (k.startsWith('#')) details[k.slice(1)] = map[k];
      else regionen[k] = map[k];
    });

    BodyMap.heatmap(heatWrap, regionen);

    const zeile = (label, wert, detail) =>
      `<div class="balken-zeile ${detail ? 'detail' : ''}">` +
      `<div class="balken-label"><span>${label}</span><span class="wert">${wert} %</span></div>` +
      `<div class="balken-hintergrund"><div class="balken-fuellung" style="width:${wert}%"></div></div>` +
      `</div>`;

    let html = Object.entries(regionen)
      .sort((a, b) => b[1] - a[1])
      .map(([r, w]) => zeile(regionKurz(r), w, false))
      .join('');

    const detailEintraege = Object.entries(details).sort((a, b) => b[1] - a[1]);
    if (detailEintraege.length) {
      html += `<div class="hinweis-klein" style="margin:8px 0 6px;">In detail:</div>` +
        detailEintraege.map(([n, w]) => zeile(n, w, true)).join('');
    }
    balken.innerHTML = html;
  }
};
