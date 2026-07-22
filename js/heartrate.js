/* MuskelAtlas — Puls-Schicht (Web Bluetooth „Heart Rate Service")
   Bewusst als austauschbare Quelle gekapselt: Die spätere native App
   (Capacitor) kann hier eine BLE-Plugin- oder Health-Connect-Quelle
   einhängen, ohne dass der Rest der App etwas merkt.

   Kompatibel: alle Brustgurte (Polar, Garmin, Wahoo …) sowie Garmin-/
   Polar-Uhren mit aktivierter Puls-Übertragung („Broadcast").
   Nicht kompatibel (Web-Version): Apple Watch, Fitbit — senden den
   Bluetooth-Standard nicht. */

const Puls = {
  unterstuetzt: typeof navigator !== 'undefined' && !!navigator.bluetooth,
  geraet: null,
  charakteristik: null,
  verbunden: false,
  geraeteName: '',
  bpm: 0,
  verlauf: [],            // { t: Zeitstempel ms, bpm }
  onUpdate: null,         // Callback (bpm)
  onStatus: null,         // Callback ('verbunden' | 'getrennt' | 'verbinde')
  _reconnectVersuche: 0,
  _sollVerbunden: false,

  async koppeln() {
    if (!this.unterstuetzt) throw new Error('Web Bluetooth wird von diesem Browser nicht unterstützt.');
    const geraet = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }]
    });
    this.geraet = geraet;
    this._sollVerbunden = true;
    geraet.addEventListener('gattserverdisconnected', () => this._getrennt());
    await this._verbinde();
  },

  async _verbinde() {
    if (!this.geraet) return;
    this._status('verbinde');
    const server = await this.geraet.gatt.connect();
    const service = await server.getPrimaryService('heart_rate');
    const char = await service.getCharacteristic('heart_rate_measurement');
    await char.startNotifications();
    char.addEventListener('characteristicvaluechanged', ev => this._messwert(ev));
    this.charakteristik = char;
    this.verbunden = true;
    this.geraeteName = this.geraet.name || 'Pulsgerät';
    this._reconnectVersuche = 0;
    this._status('verbunden');
  },

  _messwert(ev) {
    const dv = ev.target.value;
    const flags = dv.getUint8(0);
    const bpm = (flags & 0x1) ? dv.getUint16(1, true) : dv.getUint8(1);
    if (bpm > 25 && bpm < 250) {
      this.bpm = bpm;
      this.verlauf.push({ t: Date.now(), bpm });
      if (this.verlauf.length > 21600) this.verlauf.shift(); // Schutz vor Endlos-Wachstum
      if (this.onUpdate) this.onUpdate(bpm);
    }
  },

  _getrennt() {
    this.verbunden = false;
    this._status('getrennt');
    // Automatischer Wiederverbindungsversuch (z. B. kurzer Funkabriss im Studio)
    if (this._sollVerbunden && this._reconnectVersuche < 5) {
      this._reconnectVersuche++;
      setTimeout(() => {
        if (this._sollVerbunden && !this.verbunden) {
          this._verbinde().catch(() => this._getrennt());
        }
      }, 2000 * this._reconnectVersuche);
    }
  },

  trennen() {
    this._sollVerbunden = false;
    if (this.geraet && this.geraet.gatt.connected) this.geraet.gatt.disconnect();
    this.verbunden = false;
    this.bpm = 0;
    this._status('getrennt');
  },

  _status(s) { if (this.onStatus) this.onStatus(s); },

  verlaufSeit(zeitstempel) {
    return this.verlauf.filter(p => p.t >= zeitstempel);
  },

  /* ---------- Kalorien & Formeln (Schätzwerte) ---------- */

  /* Kalorienverbrauch aus Herzfrequenz-Verlauf (Formel nach Keytel et al. 2005).
     Braucht Alter (Jahre), Gewicht (kg), Geschlecht ('m'|'w'). */
  kalorienAusVerlauf(verlauf, profil, geschlecht) {
    if (!verlauf || verlauf.length < 2 || !profil.alter || !profil.gewicht) return null;
    let kcal = 0;
    for (let i = 1; i < verlauf.length; i++) {
      const dtMin = Math.min((verlauf[i].t - verlauf[i - 1].t) / 60000, 0.5); // Lücken kappen
      const hf = verlauf[i].bpm;
      let proMin;
      if (geschlecht === 'w') {
        proMin = (-20.4022 + 0.4472 * hf - 0.1263 * profil.gewicht + 0.074 * profil.alter) / 4.184;
      } else {
        proMin = (-55.0969 + 0.6309 * hf + 0.1988 * profil.gewicht + 0.2017 * profil.alter) / 4.184;
      }
      kcal += Math.max(proMin, 0) * dtMin;
    }
    return Math.round(kcal);
  },

  /* Grobe Schätzung ohne Puls: MET-basiert (Krafttraining ≈ 5 MET). */
  kalorienMET(minuten, gewicht, met) {
    if (!gewicht || !minuten) return null;
    const m = met || 5;
    return Math.round(m * 3.5 * gewicht / 200 * minuten);
  },

  /* Grundumsatz nach Mifflin-St. Jeor (kcal/Tag). */
  grundumsatz(profil, geschlecht) {
    if (!profil.alter || !profil.groesse || !profil.gewicht) return null;
    const basis = 10 * profil.gewicht + 6.25 * profil.groesse - 5 * profil.alter;
    return Math.round(basis + (geschlecht === 'w' ? -161 : 5));
  },

  tagesbedarf(profil, geschlecht) {
    const gu = this.grundumsatz(profil, geschlecht);
    if (!gu) return null;
    return Math.round(gu * (profil.aktivitaet || 1.375));
  },

  /* Heart-rate zone relative to estimated HRmax (220 − age). */
  zone(bpm, alter) {
    if (!bpm || !alter) return null;
    const p = bpm / (220 - alter) * 100;
    if (p < 60) return { name: 'Easy', farbe: '#8b95a6', prozent: p };
    if (p < 70) return { name: 'Fat burn', farbe: '#3ddc84', prozent: p };
    if (p < 80) return { name: 'Endurance', farbe: '#ffd23f', prozent: p };
    if (p < 90) return { name: 'Intense', farbe: '#ff6b2c', prozent: p };
    return { name: 'Max effort', farbe: '#ff4d5e', prozent: p };
  }
};
