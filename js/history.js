/* MuscleAtlas — training history: finished sessions, weekly volume, per-exercise progress */

const Historie = {

  /* ---------- Formatting helpers ---------- */

  // 840 kg stays kg, 12 400 kg becomes 12.4 t — a workout total is easier to read that way.
  volumenKurz(kg) {
    if (!kg) return '0';
    if (kg >= 1000) return (Math.round(kg / 100) / 10) + ' t';
    return Math.round(kg) + ' kg';
  },

  dauerKurz(ms) {
    const min = Math.round(ms / 60000);
    if (min < 60) return min + ' min';
    return Math.floor(min / 60) + ':' + String(min % 60).padStart(2, '0') + ' h';
  },

  datumLang(ts) {
    return new Date(ts).toLocaleDateString('en-GB',
      { weekday: 'short', day: 'numeric', month: 'short' });
  },

  uhrzeit(ts) {
    return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  },

  volumenVonSession(s) {
    return (s.saetze || []).reduce((sum, x) => sum + x.gewicht * x.wdh, 0);
  },

  /* ---------- Tab ---------- */

  render() {
    const ziel = document.getElementById('historieInhalt');
    if (!ziel) return;
    const sessions = Speicher.sessionsNeuZuerst();

    if (!sessions.length) {
      ziel.innerHTML = `<div class="training-karte">` +
        `<h2 class="seiten-titel" style="margin-bottom:10px;">History</h2>` +
        `<div class="leer-hinweis">No sessions yet.<br>` +
        `Finish a workout in the Training tab and it shows up here — ` +
        `with sets, weights, volume and your personal bests.</div></div>`;
      return;
    }

    ziel.innerHTML = this.statistikHtml(sessions) +
      this.wochenChartHtml(sessions) +
      this.listeHtml(sessions);

    ziel.querySelectorAll('[data-sid]').forEach(k => {
      k.addEventListener('click', () => this.zeigeSession(k.getAttribute('data-sid')));
    });
  },

  statistikHtml(sessions) {
    const jetzt = Date.now();
    const woche = jetzt - 7 * 864e5;
    const monat = jetzt - 30 * 864e5;
    const dieseWoche = sessions.filter(s => s.start >= woche);
    const dieserMonat = sessions.filter(s => s.start >= monat);
    const volWoche = dieseWoche.reduce((v, s) => v + this.volumenVonSession(s), 0);
    const volGesamt = sessions.reduce((v, s) => v + this.volumenVonSession(s), 0);

    return `<div class="training-karte">` +
      `<h2 class="seiten-titel" style="margin-bottom:12px;">History</h2>` +
      `<div class="soll-werte">` +
      `<div class="soll"><b>${dieseWoche.length}</b><span>This week</span></div>` +
      `<div class="soll"><b>${this.volumenKurz(volWoche)}</b><span>Week volume</span></div>` +
      `<div class="soll"><b>${dieserMonat.length}</b><span>30 days</span></div>` +
      `</div>` +
      `<div class="soll-werte">` +
      `<div class="soll"><b>${sessions.length}</b><span>Sessions</span></div>` +
      `<div class="soll"><b>${this.volumenKurz(volGesamt)}</b><span>Total volume</span></div>` +
      `</div>` +
      `<div class="hinweis-klein" style="margin-top:8px;">Volume = weight × reps, summed over every logged set.</div>` +
      `</div>`;
  },

  // Eight bars, one per week, most recent on the right.
  wochenChartHtml(sessions) {
    const wochen = [];
    const jetzt = Date.now();
    for (let i = 7; i >= 0; i--) {
      const bis = jetzt - i * 7 * 864e5;
      const von = bis - 7 * 864e5;
      const drin = sessions.filter(s => s.start > von && s.start <= bis);
      wochen.push({
        volumen: drin.reduce((v, s) => v + this.volumenVonSession(s), 0),
        anzahl: drin.length
      });
    }
    const max = Math.max(...wochen.map(w => w.volumen));
    if (!max) return '';

    return `<div class="training-karte">` +
      `<div class="abschnitt-titel" style="margin-top:0;">Weekly volume (last 8 weeks)</div>` +
      `<div class="wochen-chart">` +
      wochen.map((w, i) => {
        const h = Math.round(w.volumen / max * 100);
        const label = i === wochen.length - 1 ? 'now' : '−' + (wochen.length - 1 - i) + 'w';
        return `<div class="wochen-saeule" title="${this.volumenKurz(w.volumen)} · ${w.anzahl} session(s)">` +
          `<div class="saeule-bahn">` +
          (w.volumen ? `<div class="saeule" style="height:${Math.max(3, h)}%"></div>` : '') +
          `</div>` +
          `<div class="saeule-label">${label}</div></div>`;
      }).join('') +
      `</div></div>`;
  },

  listeHtml(sessions) {
    return `<div class="training-karte">` +
      `<div class="abschnitt-titel" style="margin-top:0;">Sessions</div>` +
      sessions.map(s => {
        const vol = this.volumenVonSession(s);
        const uebungen = new Set((s.saetze || []).map(x => x.uebungId)).size;
        return `<button class="historie-karte" data-sid="${s.id}">` +
          `<div class="historie-kopf">` +
          `<b>${App.escapeHtml(s.name)}</b>` +
          `<span class="hinweis-klein">${this.datumLang(s.start)}</span>` +
          `</div>` +
          `<div class="historie-werte">` +
          `<span>${this.dauerKurz(s.dauerMs)}</span>` +
          `<span>${(s.saetze || []).length} sets</span>` +
          `<span>${uebungen} ex.</span>` +
          (vol ? `<span>${this.volumenKurz(vol)}</span>` : '') +
          (s.kcal ? `<span>≈${s.kcal} kcal</span>` : '') +
          (s.oPuls ? `<span>❤ ${s.oPuls}</span>` : '') +
          `</div></button>`;
      }).join('') +
      `</div>`;
  },

  /* ---------- Session detail ---------- */

  zeigeSession(id) {
    const s = Speicher.daten.verlauf.find(x => x.id === id);
    if (!s) return;
    const wrap = document.getElementById('sessionDetailInhalt');

    // Group the flat set list back into exercises, keeping the training order.
    const gruppen = [];
    (s.saetze || []).forEach(x => {
      let g = gruppen.find(y => y.uebungId === x.uebungId);
      if (!g) { g = { uebungId: x.uebungId, saetze: [] }; gruppen.push(g); }
      g.saetze.push(x);
    });

    wrap.innerHTML = `<div class="overlay-griff"></div>` +
      `<div class="overlay-kopf">` +
      `<div><h2>${App.escapeHtml(s.name)}</h2>` +
      `<div class="hinweis-klein">${this.datumLang(s.start)}, ${this.uhrzeit(s.start)}</div></div>` +
      `<button class="schliessen-btn" data-schliessen>✕</button></div>` +

      `<div class="soll-werte">` +
      `<div class="soll"><b>${this.dauerKurz(s.dauerMs)}</b><span>Duration</span></div>` +
      `<div class="soll"><b>${(s.saetze || []).length}</b><span>Sets</span></div>` +
      `<div class="soll"><b>${this.volumenKurz(this.volumenVonSession(s))}</b><span>Volume</span></div>` +
      `</div>` +
      (s.oPuls || s.kcal
        ? `<div class="soll-werte">` +
          (s.oPuls ? `<div class="soll"><b>${s.oPuls}</b><span>Avg HR</span></div>` : '') +
          (s.maxPuls ? `<div class="soll"><b>${s.maxPuls}</b><span>Max HR</span></div>` : '') +
          (s.kcal ? `<div class="soll"><b>≈${s.kcal}</b><span>kcal</span></div>` : '') +
          `</div>`
        : '') +

      gruppen.map(g => {
        const u = uebungVonId(g.uebungId);
        return `<div class="satz-block">` +
          `<div class="satz-block-titel">${u ? u.name : g.uebungId}</div>` +
          `<div class="satz-liste">` +
          g.saetze.map((x, i) =>
            `<div class="satz-eintrag"><span class="satz-nr">${i + 1}</span>` +
            `<span>${x.wdh} × ${x.gewicht > 0 ? x.gewicht + ' kg' : 'bodyweight'}</span></div>`
          ).join('') +
          `</div></div>`;
      }).join('') +

      `<div class="btn-zeile" style="margin-top:16px;">` +
      `<button class="btn klein gefahr" id="sessionLoeschen">Delete session</button>` +
      `</div>`;

    App.zeigeOverlay('sessionDetail');
    wrap.querySelector('[data-schliessen]').addEventListener('click', () => App.schliesseOverlay('sessionDetail'));
    wrap.querySelector('#sessionLoeschen').addEventListener('click', () => {
      if (!confirm('Delete this session from your history?')) return;
      Speicher.loescheSession(id);
      App.schliesseOverlay('sessionDetail');
      this.render();
      App.toast('Session deleted.');
    });
  },

  /* ---------- Per-exercise progress (shown in the exercise detail overlay) ---------- */

  uebungFortschrittHtml(uebungId) {
    const verlauf = Speicher.verlaufFuerUebung(uebungId);
    if (!verlauf.length) {
      return `<div class="variation-box"><h3>Your progress</h3>` +
        `<div class="hinweis-klein">No logged sets yet. Train this exercise once and ` +
        `your weights, best set and trend show up here.</div></div>`;
    }

    const best = Speicher.besterSatz(uebungId);
    const letzte = verlauf[0];
    const bestesSatzVon = liste =>
      liste.slice().sort((a, b) => b.gewicht - a.gewicht || b.wdh - a.wdh)[0];
    const letzterBester = bestesSatzVon(letzte.saetze);

    // Oldest → newest, best set per session, capped at the last 12 sessions.
    // Bodyweight work has no weight to plot, so it is charted by reps instead.
    const nurKoerpergewicht = !best;
    const punkte = verlauf.slice(0, 12).reverse().map(v => {
      const b = bestesSatzVon(v.saetze);
      return { wert: nurKoerpergewicht ? b.wdh : b.gewicht };
    });

    return `<div class="variation-box"><h3>Your progress</h3>` +
      `<div class="soll-werte" style="margin-bottom:10px;">` +
      (best
        ? `<div class="soll"><b>${best.wdh} × ${best.gewicht}</b><span>Best set (kg)</span></div>`
        : `<div class="soll"><b>${Math.max(...verlauf.flatMap(v => v.saetze.map(x => x.wdh)))}</b><span>Best reps</span></div>`) +
      `<div class="soll"><b>${letzterBester.wdh}${letzterBester.gewicht > 0 ? ' × ' + letzterBester.gewicht : ''}</b><span>Last session</span></div>` +
      `<div class="soll"><b>${verlauf.length}</b><span>Sessions</span></div>` +
      `</div>` +
      this.sparklineHtml(punkte) +
      `<div class="hinweis-klein">Best set per session${nurKoerpergewicht ? ', charted by reps' : ', charted by weight'}.</div>` +
      `</div>`;
  },

  sparklineHtml(punkte) {
    if (punkte.length < 2) return '';
    const B = 260, H = 64, pad = 6;
    const werte = punkte.map(p => p.wert);
    const min = Math.min(...werte), max = Math.max(...werte);
    const spanne = max - min || 1;
    const x = i => pad + i * (B - 2 * pad) / (punkte.length - 1);
    const y = v => H - pad - (v - min) / spanne * (H - 2 * pad);
    const linie = punkte.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.wert).toFixed(1)).join(' ');
    const flaeche = linie + ` L${x(punkte.length - 1).toFixed(1)} ${H} L${x(0).toFixed(1)} ${H} Z`;

    return `<div class="sparkline">` +
      `<svg viewBox="0 0 ${B} ${H}" preserveAspectRatio="none" role="img" aria-label="Progress chart">` +
      `<defs><linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">` +
      `<stop offset="0" stop-color="#ff6b2c"/><stop offset="1" stop-color="#ff2d78"/></linearGradient>` +
      `<linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#ff2d78" stop-opacity=".28"/>` +
      `<stop offset="1" stop-color="#ff2d78" stop-opacity="0"/></linearGradient></defs>` +
      `<path d="${flaeche}" fill="url(#sparkFill)"/>` +
      `<path d="${linie}" fill="none" stroke="url(#sparkGrad)" stroke-width="2.5" ` +
      `stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` +
      punkte.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.wert).toFixed(1)}" r="2.6" fill="#ff2d78"/>`).join('') +
      `</svg>` +
      `<div class="sparkline-achse"><span>${min}</span><span>${max}</span></div>` +
      `</div>`;
  }
};
