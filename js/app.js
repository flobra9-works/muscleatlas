/* MuscleAtlas — app shell: init, tabs, onboarding, settings */

const App = {
  aktiverTab: 'muskeln',
  _toastTimer: null,

  escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  toast(text) {
    const t = document.getElementById('toast');
    t.textContent = text;
    t.classList.add('sichtbar');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('sichtbar'), 2600);
  },

  /* ---------- Overlays ---------- */

  zeigeOverlay(id) {
    document.getElementById(id).classList.remove('versteckt');
    document.body.style.overflow = 'hidden';
  },
  schliesseOverlay(id) {
    document.getElementById(id).classList.add('versteckt');
    if (!document.querySelector('.overlay:not(.versteckt)')) document.body.style.overflow = '';
  },
  initOverlays() {
    document.querySelectorAll('.overlay').forEach(ov => {
      ov.addEventListener('click', ev => {
        if (ev.target === ov && ov.id !== 'onboarding') this.schliesseOverlay(ov.id);
      });
    });
    document.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') {
        const offen = Array.from(document.querySelectorAll('.overlay:not(.versteckt)')).pop();
        if (offen && offen.id !== 'onboarding') this.schliesseOverlay(offen.id);
      }
    });
  },

  /* ---------- Tabs ---------- */

  zeigeTab(name) {
    this.aktiverTab = name;
    document.querySelectorAll('.tab-panel').forEach(p =>
      p.classList.toggle('aktiv', p.id === 'tab-' + name));
    document.querySelectorAll('.tab-bar button').forEach(b =>
      b.classList.toggle('aktiv', b.getAttribute('data-tab') === name));
    if (name === 'workouts') Workouts.render();
    if (name === 'training') Training.render();
    window.scrollTo({ top: 0 });
  },

  alleAnsichtenAktualisieren() {
    BodyMap.render();
    Uebungen.renderGruppenListe();
    if (this.aktiverTab === 'workouts') Workouts.render();
    if (this.aktiverTab === 'training') Training.render();
    this.aktualisiereGeschlechtKnopf();
  },

  /* ---------- Body view (male/female) ---------- */

  aktualisiereGeschlechtKnopf() {
    const btn = document.getElementById('geschlechtToggle');
    btn.textContent = Speicher.daten.geschlecht === 'w' ? '♀' : '♂';
  },

  setzeGeschlecht(g, leise) {
    Speicher.daten.geschlecht = g;
    Speicher.speichere();
    BodyMap.render();
    this.aktualisiereGeschlechtKnopf();
    if (!leise) this.toast(g === 'w' ? 'Body view: female' : 'Body view: male');
  },

  /* ---------- Onboarding ---------- */

  zeigeOnboarding() {
    document.getElementById('onboardingMann').innerHTML = BodySVG.erstelle('m', 'vorne');
    document.getElementById('onboardingFrau').innerHTML = BodySVG.erstelle('w', 'vorne');
    this.zeigeOverlay('onboarding');
    document.getElementById('wahlMann').addEventListener('click', () => this._onboardingFertig('m'));
    document.getElementById('wahlFrau').addEventListener('click', () => this._onboardingFertig('w'));
  },
  _onboardingFertig(g) {
    this.schliesseOverlay('onboarding');
    this.setzeGeschlecht(g, true);
    this.toast('Let’s go! Tap a muscle. 💪');
  },

  /* ---------- Settings ---------- */

  zeigeEinstellungen() {
    const p = Speicher.daten.profil;
    const e = Speicher.daten.einstellungen;
    const wrap = document.getElementById('einstellungenInhalt');

    const schalter = (id, label, beschreibung, an) =>
      `<div class="schalter-zeile"><div><b>${label}</b><div class="beschreibung">${beschreibung}</div></div>` +
      `<label class="schalter"><input type="checkbox" id="${id}" ${an ? 'checked' : ''}><span class="knubbel"></span></label></div>`;

    wrap.innerHTML = `<div class="overlay-griff"></div>` +
      `<div class="overlay-kopf"><h2>Settings</h2>` +
      `<button class="schliessen-btn" data-schliessen>✕</button></div>` +

      `<div class="abschnitt-titel">Profile (for calorie estimates)</div>` +
      `<div class="feld-zeile">` +
      `<div class="feld"><label>Age</label><input type="number" id="pAlter" min="10" max="99" value="${p.alter || ''}" placeholder="30"></div>` +
      `<div class="feld"><label>Height cm</label><input type="number" id="pGroesse" min="120" max="230" value="${p.groesse || ''}" placeholder="178"></div>` +
      `<div class="feld"><label>Weight kg</label><input type="number" id="pGewicht" min="30" max="300" step="0.5" value="${p.gewicht || ''}" placeholder="80"></div>` +
      `</div>` +
      `<div class="feld"><label>Daily activity</label><select id="pAktivitaet">` +
      `<option value="1.2" ${p.aktivitaet === 1.2 ? 'selected' : ''}>Mostly sitting (office job)</option>` +
      `<option value="1.375" ${p.aktivitaet === 1.375 ? 'selected' : ''}>Lightly active (1–3 workouts/week)</option>` +
      `<option value="1.55" ${p.aktivitaet === 1.55 ? 'selected' : ''}>Active (3–5 workouts/week)</option>` +
      `<option value="1.725" ${p.aktivitaet === 1.725 ? 'selected' : ''}>Very active (6–7 workouts/week)</option>` +
      `</select></div>` +
      `<div class="variation-erklaerung" id="kalorienInfo" style="margin-top:10px;"></div>` +

      `<div class="abschnitt-titel">Training</div>` +
      schalter('sSprache', 'Voice announcements', 'Countdown and exercises are announced', e.sprachausgabe) +
      schalter('sTon', 'Sound', 'Beeps for countdown and end of rest', e.ton) +
      schalter('sVibration', 'Vibration', 'On your phone when rest ends', e.vibration) +

      `<div class="abschnitt-titel">Body view</div>` +
      `<div class="chip-zeile">` +
      `<button class="chip ${Speicher.daten.geschlecht !== 'w' ? 'aktiv' : ''}" data-g="m">♂ Male</button>` +
      `<button class="chip ${Speicher.daten.geschlecht === 'w' ? 'aktiv' : ''}" data-g="w">♀ Female</button>` +
      `</div>` +

      `<div class="abschnitt-titel">Data</div>` +
      `<div class="hinweis-klein" style="margin-bottom:8px;">All data stays on this device only (no account, no cloud). Back it up to a file regularly.</div>` +
      `<div class="btn-zeile" style="margin-top:6px;">` +
      `<button class="btn klein" id="sExport">⬇ Create backup</button>` +
      `<button class="btn klein" id="sImport">⬆ Load backup</button>` +
      `</div>` +
      `<input type="file" id="sImportDatei" accept=".json,application/json" style="display:none">` +
      `<div class="hinweis-klein" style="margin-top:16px; text-align:center;">MuscleAtlas · Version 2.0 · Calorie and activation values are estimates, not medical advice.</div>`;

    this.zeigeOverlay('einstellungen');
    wrap.querySelector('[data-schliessen]').addEventListener('click', () => this.schliesseOverlay('einstellungen'));

    const aktualisiereKalorien = () => {
      const info = wrap.querySelector('#kalorienInfo');
      const gu = Puls.grundumsatz(p, Speicher.daten.geschlecht);
      const tb = Puls.tagesbedarf(p, Speicher.daten.geschlecht);
      info.innerHTML = gu
        ? `Basal metabolic rate: <b>≈ ${gu} kcal/day</b> · Total daily needs: <b>≈ ${tb} kcal/day</b> <span class="hinweis-klein">(Mifflin-St Jeor estimate)</span>`
        : `Fill in age, height and weight to see your daily calorie needs.`;
    };

    const bindeZahl = (id, feld, ganz) => {
      wrap.querySelector('#' + id).addEventListener('change', ev => {
        const wert = ganz ? parseInt(ev.target.value, 10) : parseFloat(ev.target.value);
        p[feld] = isNaN(wert) ? null : wert;
        Speicher.speichere();
        aktualisiereKalorien();
      });
    };
    bindeZahl('pAlter', 'alter', true);
    bindeZahl('pGroesse', 'groesse', true);
    bindeZahl('pGewicht', 'gewicht', false);
    wrap.querySelector('#pAktivitaet').addEventListener('change', ev => {
      p.aktivitaet = parseFloat(ev.target.value);
      Speicher.speichere();
      aktualisiereKalorien();
    });

    const bindeSchalter = (id, feld) => {
      wrap.querySelector('#' + id).addEventListener('change', ev => {
        Speicher.daten.einstellungen[feld] = ev.target.checked;
        Speicher.speichere();
      });
    };
    bindeSchalter('sSprache', 'sprachausgabe');
    bindeSchalter('sTon', 'ton');
    bindeSchalter('sVibration', 'vibration');

    wrap.querySelectorAll('[data-g]').forEach(chip => {
      chip.addEventListener('click', () => {
        this.setzeGeschlecht(chip.getAttribute('data-g'));
        wrap.querySelectorAll('[data-g]').forEach(c =>
          c.classList.toggle('aktiv', c === chip));
      });
    });

    wrap.querySelector('#sExport').addEventListener('click', () => Speicher.exportiere());
    const dateiInput = wrap.querySelector('#sImportDatei');
    wrap.querySelector('#sImport').addEventListener('click', () => dateiInput.click());
    dateiInput.addEventListener('change', () => {
      const datei = dateiInput.files[0];
      if (!datei) return;
      const leser = new FileReader();
      leser.onload = () => {
        const erg = Speicher.importiere(String(leser.result));
        if (erg.ok) {
          this.toast(`Import successful (${erg.anzahl} workouts).`);
          this.schliesseOverlay('einstellungen');
          this.alleAnsichtenAktualisieren();
        } else this.toast('⚠ ' + erg.fehler);
      };
      leser.readAsText(datei);
    });

    aktualisiereKalorien();
  },

  /* ---------- Init ---------- */

  init() {
    Speicher.lade();
    this.initOverlays();
    Uebungen.init();
    BodyMap.render();
    this.aktualisiereGeschlechtKnopf();

    document.getElementById('geschlechtToggle').addEventListener('click', () =>
      this.setzeGeschlecht(Speicher.daten.geschlecht === 'w' ? 'm' : 'w'));
    document.getElementById('einstellungenBtn').addEventListener('click', () =>
      this.zeigeEinstellungen());
    document.querySelectorAll('.tab-bar button').forEach(btn =>
      btn.addEventListener('click', () => this.zeigeTab(btn.getAttribute('data-tab'))));

    // Re-acquire the screen wake lock after tab switches
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && Training.aktiv) Training._wakeLockAn();
    });

    // Warm up voices early (browsers load them asynchronously)
    if ('speechSynthesis' in window) speechSynthesis.getVoices();

    // Service worker only over http(s) — file:// works without it
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    if (!Speicher.daten.geschlecht) this.zeigeOnboarding();

    // Deep links: ?gruppe=ruecken[&region=lat], ?uebung=rudern-kabel, ?tab=training
    const params = new URLSearchParams(location.search);
    if (params.get('tab')) this.zeigeTab(params.get('tab'));
    if (params.get('gruppe')) Uebungen.waehleGruppe(params.get('gruppe'), params.get('region'));
    if (params.get('uebung')) Uebungen.zeigeDetail(params.get('uebung'));
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
