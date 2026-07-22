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

  /* ---------- Export / Import ---------- */

  exportiere() {
    const inhalt = {
      app: 'MuscleAtlas', version: 2, exportiertAm: new Date().toISOString(),
      geschlecht: this.daten.geschlecht,
      profil: this.daten.profil,
      einstellungen: this.daten.einstellungen,
      workouts: this.daten.workouts,
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
    this.speichere();
    return { ok: true, anzahl: this.daten.workouts.length };
  }
};
