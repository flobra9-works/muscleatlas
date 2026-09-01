/* MuscleAtlas — training mode: flow, rest timer with voice countdown,
   heart rate display, calories, Spotify player */

const Training = {
  aktiv: null,            // { workoutId, uebungIndex, satzNummer, gestartet, fertigeSaetze,
                          //   pausenEnde, pausenDauer, saetze: [logged], werte: [per exercise] }
  zusammenfassung: null,
  intervall: null,
  audioCtx: null,
  wakeLockObj: null,
  _letzteZahl: null,
  _kcalCache: { t: 0, wert: null },

  /* ---------- Rendering ---------- */

  render() {
    const wrap = document.getElementById('trainingInhalt');
    if (!document.getElementById('trainingHaupt')) {
      wrap.innerHTML = `<div id="trainingHaupt"></div><div id="spotifyPanel"></div>`;
      this.renderSpotify();
    }
    this.renderHaupt();
  },

  renderHaupt() {
    const ziel = document.getElementById('trainingHaupt');
    if (!ziel) return;
    if (this.aktiv) ziel.innerHTML = this.laufendHtml();
    else if (this.zusammenfassung) ziel.innerHTML = this.zusammenfassungHtml();
    else ziel.innerHTML = this.startHtml();
    this.bindeHaupt();
  },

  /* ----- View: start (no session running) ----- */

  startHtml() {
    const ws = Speicher.daten.workouts;
    const gewaehlt = Speicher.daten.letztesWorkoutId;
    let html = `<div class="training-karte">` +
      `<h2 class="seiten-titel" style="margin-bottom:10px;">Start Training</h2>`;

    if (!ws.length) {
      html += `<div class="leer-hinweis">Create a routine in the Workouts tab first.</div>`;
    } else {
      html += ws.map(w => {
        const saetze = w.uebungen.reduce((s, e) => s + e.saetze, 0);
        const aktivKlasse = w.id === gewaehlt ? 'aktiv' : '';
        return `<button class="chip ${aktivKlasse}" style="width:100%; justify-content:space-between; display:flex; margin-bottom:7px; padding:12px 14px;" data-wid="${w.id}">` +
          `<span>${App.escapeHtml(w.name)}</span>` +
          `<span class="hinweis-klein">${w.uebungen.length} ex. · ${saetze} sets</span></button>`;
      }).join('');
      const startbar = gewaehlt && Speicher.workoutVonId(gewaehlt) && Speicher.workoutVonId(gewaehlt).uebungen.length;
      html += `<div class="btn-zeile"><button class="btn primaer breit" id="tStart" ${startbar ? '' : 'disabled'}>▶ Start workout</button></div>`;
    }
    html += `</div>`;
    html += this.pulsPanelHtml();
    return html;
  },

  pulsPanelHtml() {
    let inhalt;
    if (!Puls.unterstuetzt) {
      inhalt = `<div class="hinweis-klein">Heart-rate pairing needs Chrome or Edge (Web Bluetooth). ` +
        `On your phone: Chrome for Android.</div>`;
    } else if (Puls.verbunden) {
      inhalt = `<div class="training-status-zeile">` +
        `<div class="puls-anzeige"><span class="herz">❤</span> <span id="pulsWertIdle">${Puls.bpm || '–'}</span> bpm` +
        `<span class="hinweis-klein" style="font-weight:400;">(${App.escapeHtml(Puls.geraeteName)})</span></div>` +
        `<button class="btn klein" id="pulsTrennen">Disconnect</button></div>`;
    } else {
      inhalt = `<button class="btn breit" id="pulsKoppeln">📡 Pair heart-rate device</button>` +
        `<div class="hinweis-klein" style="margin-top:8px;">Works with chest straps (Polar, Garmin, Wahoo …) and watches that ` +
        `broadcast heart rate (Garmin: “Broadcast Heart Rate”, Polar: “HR broadcast”). ` +
        `Apple Watch and Fitbit unfortunately don’t send this standard.</div>`;
    }
    return `<div class="training-karte"><div class="abschnitt-titel" style="margin-top:0;">Heart rate &amp; calories</div>${inhalt}</div>`;
  },

  /* ----- View: session running ----- */

  laufendHtml() {
    const a = this.aktiv;
    const w = Speicher.workoutVonId(a.workoutId);
    const eintrag = w.uebungen[a.uebungIndex];
    const u = uebungVonId(eintrag.uebungId);
    const gesamtSaetze = w.uebungen.reduce((s, e) => s + e.saetze, 0);
    const fortschritt = Math.round(a.fertigeSaetze / gesamtSaetze * 100);

    let html = `<div class="training-karte">` +
      `<div class="training-status-zeile">` +
      `<div><b>${App.escapeHtml(w.name)}</b><div class="hinweis-klein">Exercise ${a.uebungIndex + 1} of ${w.uebungen.length}</div></div>` +
      `<div style="text-align:right;"><span class="gross-zahl" id="tGesamt">0:00</span>` +
      `<div class="hinweis-klein">Total time</div></div>` +
      `</div>` +
      `<div class="fortschritts-balken"><div style="width:${fortschritt}%"></div></div>` +
      `<div class="training-status-zeile" id="pulsZeile">${this.pulsZeileHtml()}</div>` +
      `</div>`;

    html += `<div class="training-karte">` +
      `<div class="aktuelle-uebung">` +
      `<div class="uebung-titel">${u.name}</div>` +
      `<div class="satz-info">Set <b>${a.satzNummer}</b> of ${eintrag.saetze}</div>` +
      `</div>` +
      this.logZeileHtml(eintrag, u);

    if (a.pausenEnde) {
      const umfang = 2 * Math.PI * 84;
      html += `<div class="timer-kreis-wrap"><div class="timer-kreis">` +
        `<svg viewBox="0 0 190 190">` +
        `<defs><linearGradient id="ringVerlauf" x1="0%" y1="0%" x2="100%" y2="100%">` +
        `<stop offset="0%" stop-color="#ff6b2c"/><stop offset="100%" stop-color="#ff2d78"/>` +
        `</linearGradient></defs>` +
        `<circle class="ring-bg" cx="95" cy="95" r="84"/>` +
        `<circle class="ring" id="tRing" cx="95" cy="95" r="84" stroke="url(#ringVerlauf)" stroke-dasharray="${umfang}" stroke-dashoffset="0"/>` +
        `</svg>` +
        `<div class="timer-mitte"><div class="zeit" id="tPause">–</div><div class="label">Rest</div></div>` +
        `</div></div>` +
        `<div class="btn-zeile">` +
        `<button class="btn" id="tPlus15">+15 s</button>` +
        `<button class="btn" id="tMinus15">−15 s</button>` +
        `<button class="btn primaer" id="tSkip">Skip rest ▶</button>` +
        `</div>`;
    } else {
      html += `<div class="btn-zeile">` +
        `<button class="btn primaer breit" id="tSatzFertig" style="padding:18px; font-size:1.05rem;">✓ Set done</button>` +
        `</div>`;
    }

    html += `<div class="btn-zeile">` +
      `<button class="btn klein" id="tZurueck" ${a.uebungIndex === 0 ? 'disabled' : ''}>← Exercise</button>` +
      `<button class="btn klein" id="tWeiter" ${a.uebungIndex >= w.uebungen.length - 1 ? 'disabled' : ''}>Exercise →</button>` +
      `<button class="btn klein gefahr" id="tBeenden">■ End</button>` +
      `</div></div>`;

    return html;
  },

  /* Editable "what am I actually lifting" row. Pre-filled from the last session,
     falling back to the planned values. */
  logZeileHtml(eintrag, u) {
    const werte = this.aktiv.werte[this.aktiv.uebungIndex];
    const koerpergewicht = u.geraet === 'Bodyweight';
    const schritt = koerpergewicht ? 1.25 : 2.5;
    const stepper = (feld, label, wert, delta, min, step) =>
      `<div class="log-feld"><span class="log-label">${label}</span>` +
      `<div class="stepper">` +
      `<button class="step-btn" data-log="${feld}" data-delta="${-delta}" aria-label="less">−</button>` +
      `<input type="number" class="step-wert" data-log-feld="${feld}" value="${wert}" ` +
      `min="${min}" step="${step}" inputmode="${step < 1 ? 'decimal' : 'numeric'}">` +
      `<button class="step-btn" data-log="${feld}" data-delta="${delta}" aria-label="more">+</button>` +
      `</div></div>`;

    const letzte = Speicher.letzteWerte(eintrag.uebungId);
    let hinweis = `Plan: ${eintrag.saetze} × ${eintrag.wdh}` +
      (eintrag.gewicht > 0 ? ` × ${eintrag.gewicht} kg` : '') +
      (eintrag.pause ? ` · ${eintrag.pause} s rest` : '');
    if (letzte) {
      hinweis += ` · last time: ${letzte.wdh} × ${letzte.gewicht > 0 ? letzte.gewicht + ' kg' : 'bodyweight'}`;
    }

    return `<div class="log-zeile">` +
      stepper('gewicht', koerpergewicht ? 'Added kg' : 'Weight kg', werte.gewicht, schritt, 0, 0.5) +
      stepper('wdh', 'Reps', werte.wdh, 1, 0, 1) +
      `</div><div class="hinweis-klein log-hinweis">${hinweis}</div>`;
  },

  pulsZeileHtml() {
    if (!Puls.verbunden) return `<span class="hinweis-klein">No heart-rate device connected</span><span class="hinweis-klein" id="tKcal"></span>`;
    const zone = Puls.zone(Puls.bpm, Speicher.daten.profil.alter);
    return `<div class="puls-anzeige"><span class="herz">❤</span> <span id="pulsWert">${Puls.bpm || '–'}</span> bpm ` +
      (zone ? `<span class="puls-zone" style="background:${zone.farbe}22; color:${zone.farbe};">${zone.name}</span>` : '') +
      `</div><span class="hinweis-klein" id="tKcal"></span>`;
  },

  /* ----- View: summary ----- */

  zusammenfassungHtml() {
    const z = this.zusammenfassung;
    const min = Math.floor(z.dauerMs / 60000), sek = Math.floor(z.dauerMs / 1000) % 60;
    return `<div class="training-karte" style="text-align:center;">` +
      `<h2 class="seiten-titel">Workout complete 💪</h2>` +
      `<div class="soll-werte" style="margin-top:16px;">` +
      `<div class="soll"><b>${min}:${String(sek).padStart(2, '0')}</b><span>Duration</span></div>` +
      `<div class="soll"><b>${z.fertigeSaetze}/${z.gesamtSaetze}</b><span>Sets</span></div>` +
      (z.volumen ? `<div class="soll"><b>${Historie.volumenKurz(z.volumen)}</b><span>Volume</span></div>` : '') +
      (z.kcal ? `<div class="soll"><b>≈${z.kcal}</b><span>kcal</span></div>` : '') +
      `</div>` +
      (z.rekorde && z.rekorde.length
        ? `<div class="rekord-box">🏆 <b>New personal best</b>` +
          z.rekorde.map(r => `<div class="rekord-zeile">${App.escapeHtml(r.name)} — ${r.wdh} × ${r.gewicht} kg</div>`).join('') +
          `</div>`
        : '') +
      (z.oPuls ? `<div class="soll-werte">` +
        `<div class="soll"><b>${z.oPuls}</b><span>Avg HR</span></div>` +
        `<div class="soll"><b>${z.maxPuls}</b><span>Max HR</span></div>` +
        `</div>` : '') +
      (!z.kcal && !z.oPuls
        ? `<div class="hinweis-klein" style="margin-top:8px;">Tip: with a profile (settings) and/or a heart-rate strap you’ll see calorie and HR stats here.</div>`
        : `<div class="hinweis-klein" style="margin-top:8px;">Calories are an estimate${z.kcalQuelle === 'puls' ? ' based on your heart rate' : ' (no HR, MET formula)'}.</div>`) +
      `<div class="btn-zeile">` +
      `<button class="btn primaer breit" id="tFertig">Done</button>` +
      `<button class="btn" id="tZurHistorie">History</button>` +
      `</div>` +
      `</div>`;
  },

  /* ---------- Interaction ---------- */

  bindeHaupt() {
    const q = id => document.getElementById(id);

    // Start view
    document.querySelectorAll('#trainingHaupt [data-wid]').forEach(btn => {
      btn.addEventListener('click', () => {
        Speicher.daten.letztesWorkoutId = btn.getAttribute('data-wid');
        Speicher.speichere();
        this.renderHaupt();
      });
    });
    if (q('tStart')) q('tStart').addEventListener('click', () => this.starte(Speicher.daten.letztesWorkoutId));
    if (q('pulsKoppeln')) q('pulsKoppeln').addEventListener('click', () => this.koppelePuls());
    if (q('pulsTrennen')) q('pulsTrennen').addEventListener('click', () => { Puls.trennen(); this.renderHaupt(); });

    // Running session
    document.querySelectorAll('#trainingHaupt [data-log]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.werteAendern(btn.getAttribute('data-log'), parseFloat(btn.getAttribute('data-delta')));
      });
    });
    document.querySelectorAll('#trainingHaupt [data-log-feld]').forEach(inp => {
      inp.addEventListener('change', () => {
        this.werteSetzen(inp.getAttribute('data-log-feld'), parseFloat(inp.value));
      });
    });
    if (q('tSatzFertig')) q('tSatzFertig').addEventListener('click', () => this.satzFertig());
    if (q('tSkip')) q('tSkip').addEventListener('click', () => this.pauseVorbei(true));
    if (q('tPlus15')) q('tPlus15').addEventListener('click', () => this.pauseAnpassen(15));
    if (q('tMinus15')) q('tMinus15').addEventListener('click', () => this.pauseAnpassen(-15));
    if (q('tZurueck')) q('tZurueck').addEventListener('click', () => this.wechsleUebung(-1));
    if (q('tWeiter')) q('tWeiter').addEventListener('click', () => this.wechsleUebung(1));
    if (q('tBeenden')) q('tBeenden').addEventListener('click', () => {
      if (confirm('End this workout?')) this.beende();
    });

    // Summary
    if (q('tFertig')) q('tFertig').addEventListener('click', () => { this.zusammenfassung = null; this.renderHaupt(); });
    if (q('tZurHistorie')) q('tZurHistorie').addEventListener('click', () => {
      this.zusammenfassung = null;
      this.renderHaupt();
      App.zeigeTab('historie');
    });
  },

  koppelePuls() {
    Puls.onUpdate = () => {
      const el1 = document.getElementById('pulsWert');
      const el2 = document.getElementById('pulsWertIdle');
      if (el1) el1.textContent = Puls.bpm;
      if (el2) el2.textContent = Puls.bpm;
    };
    Puls.onStatus = s => {
      if (s === 'verbunden') App.toast(`Heart-rate device connected: ${Puls.geraeteName} ✓`);
      if (s === 'getrennt') App.toast('Heart-rate device disconnected.');
      this.renderHaupt();
    };
    Puls.koppeln().catch(err => {
      if (err && err.name === 'NotFoundError') return; // user cancelled the picker
      App.toast('⚠ Pairing failed: ' + (err.message || err));
    });
  },

  /* ---------- Session logic ---------- */

  starte(workoutId) {
    const w = Speicher.workoutVonId(workoutId);
    if (!w || !w.uebungen.length) return;
    this.zusammenfassung = null;
    this.aktiv = {
      workoutId, uebungIndex: 0, satzNummer: 1,
      gestartet: Date.now(), fertigeSaetze: 0,
      pausenEnde: null, pausenDauer: 0,
      saetze: [],
      // Start from what was actually lifted last time, not from the plan —
      // that is what makes the numbers creep up over weeks.
      werte: w.uebungen.map(e => {
        const letzte = Speicher.letzteWerte(e.uebungId);
        return letzte
          ? { wdh: letzte.wdh, gewicht: letzte.gewicht }
          : { wdh: e.wdh, gewicht: e.gewicht };
      })
    };
    this._initAudio();
    this._wakeLockAn();
    if (this.intervall) clearInterval(this.intervall);
    this.intervall = setInterval(() => this.tick(), 250);
    const erste = uebungVonId(w.uebungen[0].uebungId);
    this.sprich(`Workout ${w.name} started. First exercise: ${erste.name}.`);
    this.renderHaupt();
  },

  werteAendern(feld, delta) {
    const werte = this.aktiv && this.aktiv.werte[this.aktiv.uebungIndex];
    if (!werte) return;
    this.werteSetzen(feld, (werte[feld] || 0) + delta);
  },

  werteSetzen(feld, wert) {
    const werte = this.aktiv && this.aktiv.werte[this.aktiv.uebungIndex];
    if (!werte || isNaN(wert)) return;
    werte[feld] = feld === 'wdh'
      ? Math.max(0, Math.round(wert))
      : Math.max(0, Math.round(wert * 4) / 4);   // quarter-kilo steps
    this.renderHaupt();
  },

  satzFertig() {
    const a = this.aktiv;
    const w = Speicher.workoutVonId(a.workoutId);
    const eintrag = w.uebungen[a.uebungIndex];
    const werte = a.werte[a.uebungIndex];
    a.saetze.push({
      uebungId: eintrag.uebungId,
      satz: a.satzNummer,
      wdh: werte.wdh,
      gewicht: werte.gewicht
    });
    a.fertigeSaetze++;
    this.vibriere([60]);

    const letzterSatz = a.satzNummer >= eintrag.saetze;
    const letzteUebung = a.uebungIndex >= w.uebungen.length - 1;

    if (letzterSatz && letzteUebung) { this.beende(true); return; }

    if (letzterSatz) { a.uebungIndex++; a.satzNummer = 1; }
    else a.satzNummer++;

    const pause = eintrag.pause || 0;
    if (pause > 0) {
      a.pausenEnde = Date.now() + pause * 1000;
      a.pausenDauer = pause;
      this._letzteZahl = null;
      this.sprich(`${pause} seconds rest.`);
    } else {
      this.ansageNaechsterSatz();
    }
    this.renderHaupt();
  },

  pauseAnpassen(deltaSek) {
    const a = this.aktiv;
    if (!a || !a.pausenEnde) return;
    a.pausenEnde = Math.max(Date.now() + 1000, a.pausenEnde + deltaSek * 1000);
    a.pausenDauer = Math.max(1, a.pausenDauer + deltaSek);
  },

  pauseVorbei(uebersprungen) {
    const a = this.aktiv;
    if (!a) return;
    a.pausenEnde = null;
    if (!uebersprungen) {
      this.piepEnde();
      this.vibriere([220, 110, 220]);
    }
    this.ansageNaechsterSatz();
    this.renderHaupt();
  },

  ansageNaechsterSatz() {
    const a = this.aktiv;
    const w = Speicher.workoutVonId(a.workoutId);
    const eintrag = w.uebungen[a.uebungIndex];
    const u = uebungVonId(eintrag.uebungId);
    this.sprich(`Go! ${u.name}, set ${a.satzNummer} of ${eintrag.saetze}.`);
  },

  wechsleUebung(richtung) {
    const a = this.aktiv;
    const w = Speicher.workoutVonId(a.workoutId);
    const neu = a.uebungIndex + richtung;
    if (neu < 0 || neu >= w.uebungen.length) return;
    a.uebungIndex = neu;
    a.satzNummer = 1;
    a.pausenEnde = null;
    this.renderHaupt();
  },

  beende(komplett) {
    const a = this.aktiv;
    if (!a) return;
    const w = Speicher.workoutVonId(a.workoutId);
    const dauerMs = Date.now() - a.gestartet;
    const gesamtSaetze = w.uebungen.reduce((s, e) => s + e.saetze, 0);

    const verlauf = Puls.verlaufSeit(a.gestartet);
    let oPuls = null, maxPuls = null;
    if (verlauf.length > 3) {
      oPuls = Math.round(verlauf.reduce((s, p) => s + p.bpm, 0) / verlauf.length);
      maxPuls = verlauf.reduce((m, p) => Math.max(m, p.bpm), 0);
    }
    const profil = Speicher.daten.profil;
    let kcal = Puls.kalorienAusVerlauf(verlauf, profil, Speicher.daten.geschlecht);
    let kcalQuelle = 'puls';
    if (!kcal) { kcal = Puls.kalorienMET(dauerMs / 60000, profil.gewicht); kcalQuelle = 'met'; }

    // Personal records have to be judged against the history *before* this
    // session is written into it.
    const rekorde = [];
    [...new Set(a.saetze.map(s => s.uebungId))].forEach(uid => {
      const vorher = Speicher.besterSatz(uid);
      const heute = a.saetze
        .filter(s => s.uebungId === uid && s.gewicht > 0)
        .sort((x, y) => y.gewicht - x.gewicht || y.wdh - x.wdh)[0];
      if (!heute) return;
      if (!vorher || heute.gewicht > vorher.gewicht ||
          (heute.gewicht === vorher.gewicht && heute.wdh > vorher.wdh)) {
        const u = uebungVonId(uid);
        rekorde.push({ name: u ? u.name : uid, gewicht: heute.gewicht, wdh: heute.wdh, neu: !vorher });
      }
    });

    const volumen = a.saetze.reduce((s, x) => s + x.gewicht * x.wdh, 0);

    if (a.saetze.length) {
      Speicher.speichereSession({
        workoutId: a.workoutId,
        name: w.name,
        start: a.gestartet,
        dauerMs,
        saetze: a.saetze,
        geplanteSaetze: gesamtSaetze,
        oPuls, maxPuls, kcal, kcalQuelle
      });
    }

    this.zusammenfassung = { dauerMs, fertigeSaetze: a.fertigeSaetze, gesamtSaetze, oPuls, maxPuls, kcal, kcalQuelle, volumen, rekorde };
    this.aktiv = null;
    if (this.intervall) { clearInterval(this.intervall); this.intervall = null; }
    this._wakeLockAus();
    if (komplett) this.sprich('Workout complete. Strong work!');
    this.renderHaupt();
  },

  /* ---------- Tick (every 250 ms) ---------- */

  tick() {
    const a = this.aktiv;
    if (!a) return;

    // Total time
    const el = document.getElementById('tGesamt');
    if (el) {
      const s = Math.floor((Date.now() - a.gestartet) / 1000);
      el.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    // Calorie display (recalculated every 5 s)
    const kcalEl = document.getElementById('tKcal');
    if (kcalEl && Date.now() - this._kcalCache.t > 5000) {
      const profil = Speicher.daten.profil;
      let kcal = Puls.kalorienAusVerlauf(Puls.verlaufSeit(a.gestartet), profil, Speicher.daten.geschlecht);
      if (!kcal) kcal = Puls.kalorienMET((Date.now() - a.gestartet) / 60000, profil.gewicht);
      this._kcalCache = { t: Date.now(), wert: kcal };
      kcalEl.textContent = kcal ? `≈ ${kcal} kcal` : '';
    }

    // Rest countdown
    if (a.pausenEnde) {
      const restMs = a.pausenEnde - Date.now();
      const rest = Math.max(0, Math.ceil(restMs / 1000));
      const zeitEl = document.getElementById('tPause');
      const ring = document.getElementById('tRing');
      if (zeitEl) zeitEl.textContent = rest >= 60 ? Math.floor(rest / 60) + ':' + String(rest % 60).padStart(2, '0') : String(rest);
      if (ring) {
        const umfang = 2 * Math.PI * 84;
        const anteil = Math.max(0, Math.min(1, restMs / (a.pausenDauer * 1000)));
        ring.style.strokeDashoffset = String(umfang * (1 - anteil));
      }
      // Spoken countdown over the last 5 seconds
      if (rest <= 5 && rest >= 1 && this._letzteZahl !== rest) {
        this._letzteZahl = rest;
        this.sprich(String(rest), true);
        this.piep(880, 0.07);
      }
      if (restMs <= 0) this.pauseVorbei(false);
    }
  },

  /* ---------- Sound, speech, vibration, wake lock ---------- */

  _initAudio() {
    if (!this.audioCtx) {
      try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
  },

  piep(freq, dauer, wann) {
    if (!Speicher.daten.einstellungen.ton || !this.audioCtx) return;
    const ctx = this.audioCtx;
    const t = ctx.currentTime + (wann || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dauer + 0.05);
  },

  piepEnde() {
    this.piep(660, 0.1, 0);
    this.piep(660, 0.1, 0.18);
    this.piep(1320, 0.4, 0.36);
  },

  sprich(text, dringend) {
    if (!Speicher.daten.einstellungen.sprachausgabe) return;
    if (!('speechSynthesis' in window)) return;
    try {
      if (dringend) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 1.05;
      const stimme = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('en'));
      if (stimme) u.voice = stimme;
      speechSynthesis.speak(u);
    } catch (e) {}
  },

  vibriere(muster) {
    if (!Speicher.daten.einstellungen.vibration) return;
    if (navigator.vibrate) navigator.vibrate(muster);
  },

  async _wakeLockAn() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLockObj = await navigator.wakeLock.request('screen');
      }
    } catch (e) {}
  },
  _wakeLockAus() {
    if (this.wakeLockObj) { this.wakeLockObj.release().catch(() => {}); this.wakeLockObj = null; }
  },

  /* ---------- Spotify ---------- */

  renderSpotify() {
    const panel = document.getElementById('spotifyPanel');
    if (!panel) return;
    const url = Speicher.daten.spotifyUrl || '';
    const embed = this.spotifyEmbedUrl(url);

    panel.innerHTML = `<div class="training-karte">` +
      `<div class="abschnitt-titel" style="margin-top:0;">🎵 Music (Spotify)</div>` +
      (embed
        ? `<div class="spotify-bereich"><iframe src="${embed}" height="${embed.includes('/track/') ? 152 : 352}" ` +
          `allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>`
        : `<div class="hinweis-klein" style="margin-bottom:8px;">Paste a Spotify link (playlist, album or track) — ` +
          `e.g. via Share → “Copy link” in the Spotify app.</div>`) +
      `<div class="feld-zeile" style="margin-top:10px;">` +
      `<div class="feld" style="flex:3;"><input type="url" id="spotifyUrl" placeholder="https://open.spotify.com/playlist/…" value="${App.escapeHtml(url)}"></div>` +
      `<button class="btn klein" id="spotifySetzen" style="flex:1;">Apply</button>` +
      (url ? `<button class="btn klein" id="spotifyWeg" style="flex:0;" title="Remove player">✕</button>` : '') +
      `</div>` +
      (embed ? `<div class="hinweis-klein">Full songs only if you’re logged in to Spotify in this browser — otherwise 30-second previews (Spotify rule).</div>` : '') +
      `</div>`;

    panel.querySelector('#spotifySetzen').addEventListener('click', () => {
      const wert = panel.querySelector('#spotifyUrl').value.trim();
      if (wert && !this.spotifyEmbedUrl(wert)) {
        App.toast('⚠ That doesn’t look like a Spotify link.');
        return;
      }
      Speicher.daten.spotifyUrl = wert;
      Speicher.speichere();
      this.renderSpotify();
      if (wert) App.toast('Spotify player updated ✓');
    });
    const weg = panel.querySelector('#spotifyWeg');
    if (weg) weg.addEventListener('click', () => {
      Speicher.daten.spotifyUrl = '';
      Speicher.speichere();
      this.renderSpotify();
    });
  },

  spotifyEmbedUrl(url) {
    if (!url) return null;
    const m = url.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/i);
    if (!m) return null;
    return `https://open.spotify.com/embed/${m[1].toLowerCase()}/${m[2]}?theme=0`;
  }
};
