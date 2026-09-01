/* MuscleAtlas — storage layer (LocalStorage) */

const Speicher = {
  KEY: 'muscleatlas_v1',
  ALTER_KEY: 'muskelatlas_v1',   // Datenübernahme aus der deutschen v1
  daten: null,

  standard() {
    return {
      geschlecht: null,                 // 'm' | 'w'
      profil: { alter: null, groesse: null, gewicht: null, aktivitaet: 1.375 },
      einstellungen: { sprachausgabe: true, ton: true, vibration: true },
      workouts: [],                     // { id, name, uebungen: [{ uebungId, saetze, wdh, gewicht, pause }] }
      verlauf: [],                      // finished sessions, oldest first (see speichereSession)
      spotifyUrl: '',
      letztesWorkoutId: null
    };
  },

  lade() {
    let geladen = null;
    try {
      geladen = JSON.parse(localStorage.getItem(this.KEY) || 'null');
      if (!geladen) {
        // Migration: Daten aus der alten App-Version übernehmen
        const alt = JSON.parse(localStorage.getItem(this.ALTER_KEY) || 'null');
        if (alt) {
          geladen = alt;
          localStorage.setItem(this.KEY, JSON.stringify(alt));
        }
      }
    } catch (e) { geladen = null; }
    const std = this.standard();
    this.daten = Object.assign(std, geladen || {});
    this.daten.profil = Object.assign(this.standard().profil, (geladen && geladen.profil) || {});
    this.daten.einstellungen = Object.assign(this.standard().einstellungen, (geladen && geladen.einstellungen) || {});
    if (!Array.isArray(this.daten.workouts)) this.daten.workouts = [];
    if (!Array.isArray(this.daten.verlauf)) this.daten.verlauf = [];
  },

  speichere() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.daten)); }
    catch (e) { console.warn('Saving failed', e); }
  },

  /* ---------- Workouts ---------- */

  neuesWorkout(name) {
    const w = { id: 'w' + Date.now() + Math.floor(Math.random() * 999), name: name || 'New workout', uebungen: [] };
    this.daten.workouts.push(w);
    this.speichere();
    return w;
  },

  workoutVonId(id) {
    return this.daten.workouts.find(w => w.id === id) || null;
  },

  loescheWorkout(id) {
    this.daten.workouts = this.daten.workouts.filter(w => w.id !== id);
    if (this.daten.letztesWorkoutId === id) this.daten.letztesWorkoutId = null;
    this.speichere();
  },

  dupliziereWorkout(id) {
    const w = this.workoutVonId(id);
    if (!w) return null;
    const kopie = JSON.parse(JSON.stringify(w));
    kopie.id = 'w' + Date.now() + Math.floor(Math.random() * 999);
    kopie.name = w.name + ' (copy)';
    this.daten.workouts.push(kopie);
    this.speichere();
    return kopie;
  },

  fuegeUebungHinzu(workoutId, uebungId) {
    const w = this.workoutVonId(workoutId);
    const u = uebungVonId(uebungId);
    if (!w || !u) return false;
    const koerpergewicht = u.geraet === 'Bodyweight';
    w.uebungen.push({
      uebungId: uebungId,
      saetze: 3,
      wdh: koerpergewicht ? 12 : 10,
      gewicht: koerpergewicht ? 0 : 20,
      pause: 90
    });
    this.speichere();
    return true;
  },

  /* ---------- Training history ---------- */

  MAX_SESSIONS: 500,

  // rec: { workoutId, name, start, dauerMs, saetze: [{ uebungId, satz, wdh, gewicht }],
  //        geplanteSaetze, oPuls, maxPuls, kcal, kcalQuelle }
  speichereSession(rec) {
    const eintrag = Object.assign({ id: 's' + Date.now() + Math.floor(Math.random() * 999) }, rec);
    this.daten.verlauf.push(eintrag);
    if (this.daten.verlauf.length > this.MAX_SESSIONS) {
      this.daten.verlauf = this.daten.verlauf.slice(-this.MAX_SESSIONS);
    }
    this.speichere();
    return eintrag;
  },

  loescheSession(id) {
    this.daten.verlauf = this.daten.verlauf.filter(s => s.id !== id);
    this.speichere();
  },

  // Newest first — that is how every view wants it.
  sessionsNeuZuerst() {
    return this.daten.verlauf.slice().sort((a, b) => b.start - a.start);
  },

  // All logged sets of one exercise, newest session first:
  // [{ session, saetze: [{ satz, wdh, gewicht }] }]
  verlaufFuerUebung(uebungId) {
    return this.sessionsNeuZuerst()
      .map(s => ({ session: s, saetze: (s.saetze || []).filter(x => x.uebungId === uebungId) }))
      .filter(x => x.saetze.length);
  },

  // What the user actually lifted last time — pre-fills the next session.
  letzteWerte(uebungId) {
    const v = this.verlaufFuerUebung(uebungId);
    if (!v.length) return null;
    const letzte = v[0].saetze;
    const s = letzte[letzte.length - 1];
    return { gewicht: s.gewicht, wdh: s.wdh, datum: v[0].session.start };
  },

  // Heaviest set ever; ties broken by reps.
  besterSatz(uebungId) {
    let best = null;
    this.daten.verlauf.forEach(s => {
      (s.saetze || []).forEach(x => {
        if (x.uebungId !== uebungId) return;
        if (!best || x.gewicht > best.gewicht || (x.gewicht === best.gewicht && x.wdh > best.wdh)) {
          best = { gewicht: x.gewicht, wdh: x.wdh, datum: s.start };
        }
      });
    });
    return best;
  },

  /* ---------- Export / Import ---------- */

  exportiere() {
    const inhalt = {
      app: 'MuscleAtlas', version: 2, exportiertAm: new Date().toISOString(),
      geschlecht: this.daten.geschlecht,
      profil: this.daten.profil,
      einstellungen: this.daten.einstellungen,
      workouts: this.daten.workouts,
      verlauf: this.daten.verlauf,
      spotifyUrl: this.daten.spotifyUrl
    };
    const blob = new Blob([JSON.stringify(inhalt, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'muscleatlas-backup.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 300);
  },

  importiere(text) {
    let inhalt;
    try { inhalt = JSON.parse(text); } catch (e) { return { ok: false, fehler: 'That file is not valid JSON.' }; }
    if (!inhalt || (inhalt.app !== 'MuscleAtlas' && inhalt.app !== 'MuskelAtlas') || !Array.isArray(inhalt.workouts)) {
      return { ok: false, fehler: 'That is not a MuscleAtlas backup.' };
    }
    if (inhalt.geschlecht === 'm' || inhalt.geschlecht === 'w') this.daten.geschlecht = inhalt.geschlecht;
    if (inhalt.profil) this.daten.profil = Object.assign(this.standard().profil, inhalt.profil);
    if (inhalt.einstellungen) this.daten.einstellungen = Object.assign(this.standard().einstellungen, inhalt.einstellungen);
    if (typeof inhalt.spotifyUrl === 'string') this.daten.spotifyUrl = inhalt.spotifyUrl;
    // Nur Einträge mit bekannter Übungs-ID übernehmen
    this.daten.workouts = inhalt.workouts.map(w => ({
      id: String(w.id || 'w' + Date.now() + Math.random()),
      name: String(w.name || 'Workout'),
      uebungen: (Array.isArray(w.uebungen) ? w.uebungen : [])
        .filter(e => uebungVonId(e.uebungId))
        .map(e => ({
          uebungId: e.uebungId,
          saetze: Math.max(1, parseInt(e.saetze, 10) || 3),
          wdh: Math.max(1, parseInt(e.wdh, 10) || 10),
          gewicht: Math.max(0, parseFloat(e.gewicht) || 0),
          pause: Math.max(0, parseInt(e.pause, 10) || 90)
        }))
    }));
    // Training history (older backups simply have none)
    this.daten.verlauf = (Array.isArray(inhalt.verlauf) ? inhalt.verlauf : [])
      .filter(s => s && typeof s.start === 'number')
      .map(s => ({
        id: String(s.id || 's' + s.start),
        workoutId: s.workoutId || null,
        name: String(s.name || 'Workout'),
        start: s.start,
        dauerMs: Math.max(0, parseInt(s.dauerMs, 10) || 0),
        geplanteSaetze: Math.max(0, parseInt(s.geplanteSaetze, 10) || 0),
        saetze: (Array.isArray(s.saetze) ? s.saetze : [])
          .filter(x => x && uebungVonId(x.uebungId))
          .map(x => ({
            uebungId: x.uebungId,
            satz: Math.max(1, parseInt(x.satz, 10) || 1),
            wdh: Math.max(0, parseInt(x.wdh, 10) || 0),
            gewicht: Math.max(0, parseFloat(x.gewicht) || 0)
          })),
        oPuls: s.oPuls || null,
        maxPuls: s.maxPuls || null,
        kcal: s.kcal || null,
        kcalQuelle: s.kcalQuelle || null
      }))
      .sort((a, b) => a.start - b.start)
      .slice(-this.MAX_SESSIONS);
    this.speichere();
    return { ok: true, anzahl: this.daten.workouts.length, sessions: this.daten.verlauf.length };
  }
};
